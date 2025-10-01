import type { HttpContext } from '@adonisjs/core/http'
import Ticket from '#models/ticket'
import TransportationTicket from '#models/transportation_ticket'
import Event from '#models/event'
import Schedule from '#models/schedule'
import { validateTicketValidator } from '#validators/ticket_validation'
import { DateTime } from 'luxon'

export default class TicketValidationsController {
  async validate({ request, response }: HttpContext) {
    const { qrCodeHash, contextType, contextId } = await request.validateUsing(validateTicketValidator)

    let ticket: Ticket | TransportationTicket | null = null

    // 1. Trouver le billet en fonction du type de contexte
    if (contextType === 'event') {
      ticket = await Ticket.query()
        .where('qrCodeHash', qrCodeHash)
        .preload('order', (orderQuery) => {
          orderQuery.preload('event')
        })
        .first()
    } else if (contextType === 'transportation') {
      ticket = await TransportationTicket.query()
        .where('qrCodeHash', qrCodeHash)
        .preload('transportationTicketType', (ttTypeQuery) => {
          ttTypeQuery.preload('schedule')
        })
        .first()
    } else {
      return response.badRequest({ message: 'Invalid contextType provided.' })
    }

    if (!ticket) {
      return response.notFound({ message: 'Ticket not found.' })
    }

    // 2. Vérifier le statut actuel du billet
    if (ticket.status === 'checked_in') {
      return response.conflict({ message: 'Ticket already checked in.' })
    }
    if (ticket.status === 'cancelled') {
      return response.forbidden({ message: 'Ticket has been cancelled.' })
    }
    if (ticket.status !== 'valid') {
      return response.forbidden({ message: 'Ticket is not valid for check-in.' })
    }

    // 3. Vérifier la correspondance du contexte (événement/voyage) et la validité temporelle
    if (contextType === 'event' && ticket instanceof Ticket) {
      if (!ticket.order?.event || ticket.order.event.id !== contextId) {
        return response.forbidden({ message: 'Ticket is not for this event.' })
      }
      // Optionnel: Vérifier la date/heure de l'événement
      if (ticket.order.event.startTime && ticket.order.event.startTime > DateTime.now()) {
        return response.forbidden({ message: 'Event has not started yet.' })
      }
    } else if (contextType === 'transportation' && ticket instanceof TransportationTicket) {
      if (!ticket.transportationTicketType?.schedule || ticket.transportationTicketType.schedule.id !== contextId) {
        return response.forbidden({ message: 'Ticket is not for this schedule.' })
      }
      // Optionnel: Vérifier la date/heure de départ du voyage
      if (ticket.transportationTicketType.schedule.departureTime && ticket.transportationTicketType.schedule.departureTime > DateTime.now()) {
        return response.forbidden({ message: 'Departure has not started yet.' })
      }
    } else {
        // Mismatch between contextType and actual ticket type found
        return response.badRequest({ message: 'Ticket type mismatch with provided context.' });
    }


    // 4. Mettre à jour le statut du billet
    ticket.status = 'checked_in'
    await ticket.save()

    return response.ok({ message: 'Ticket successfully checked in.', ticket })
  }
}
