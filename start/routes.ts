import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import AuthController from '#controllers/auth_controller'
import ProfileController from '#controllers/profile_controller'
import OrganizationController from '#controllers/organization_controller'
import OrganizationMembersController from '#controllers/organization_members_controller'
import EventController from '#controllers/event_controller'
import TicketTypeController from '#controllers/ticket_type_controller'
import OrderController from '#controllers/order_controller'
import PaymentMethodController from '#controllers/payment_method_controller'
import UserController from '#controllers/user_controller'
import ReviewController from '#controllers/review_controller'
import StripeWebhookController from '#controllers/stripe_webhook_controller'
import PawaPayWebhookController from '#controllers/pawa_pay_webhook_controller'
import UploadController from '#controllers/upload_controller'
import CategoryController from '#controllers/category_controller'
import PawaPayController from '#controllers/pawa_pay_controller'


router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('register', [AuthController, 'register'])
        router.post('confirm-email', [AuthController, 'confirmEmail'])
        router.post('login', [AuthController, 'login'])
        router.post('forgot-password', [AuthController, 'forgotPassword'])
        router.post('reset-password', [AuthController, 'resetPassword'])
      })
      .prefix('auth')
    router.get('me', [AuthController, 'me']).use(middleware.auth())
    router.put('profile', [ProfileController, 'update']).use(middleware.auth())
    router.get('me/tickets', [UserController, 'listMyTickets']).use(middleware.auth())
    router.get('me/orders', [OrderController, 'listMyOrders']).use(middleware.auth())
    router.get('me/orders/:id', [OrderController, 'show']).use(middleware.auth())
    router
      .get('me/followed-organizations', [UserController, 'listFollowedOrganizations'])
      .use(middleware.auth())
    router
      .get('me/organizations', [OrganizationController, 'listMyOrganizations'])
      .use(middleware.auth())

    router.post('organizations', [OrganizationController, 'create']).use(middleware.auth())
    router
      .get('organizations/:organizationId/dashboard', [OrganizationController, 'dashboard'])
      .use(middleware.auth())
    router
      .post('organizations/:id/follow', [OrganizationController, 'toggleFollow'])
      .use(middleware.auth())
    router
      .get('organizations/:organizationId/transactions', [
        OrganizationController,
        'getTransactions',
      ])
      .use(middleware.auth())
    router
      .get('organizations/:organizationId/revenue-chart', [
        OrganizationController,
        'getRevenueChartData',
      ])
      .use(middleware.auth())

    router
      .group(() => {
        router
          .post(':organizationId/members', [OrganizationMembersController, 'addMember'])
          .use(middleware.auth())
        router
          .put(':organizationId/members/:memberId', [
            OrganizationMembersController,
            'updateMemberRole',
          ])
          .use(middleware.auth())
        router
          .delete(':organizationId/members/:memberId', [
            OrganizationMembersController,
            'removeMember',
          ])
          .use(middleware.auth())
        router
          .get(':organizationId/members', [OrganizationMembersController, 'listMembers'])
          .use(middleware.auth())

        router.post(':organizationId/events', [EventController, 'create']).use(middleware.auth())
        router.get(':organizationId/events', [EventController, 'index']).use(middleware.auth())
        router.get(':organizationId/events/:id', [EventController, 'show']).use(middleware.auth())
        router.put(':organizationId/events/:id', [EventController, 'update']).use(middleware.auth())
        router
          .delete(':organizationId/events/:id', [EventController, 'destroy'])
          .use(middleware.auth())
        router
          .get(':organizationId/events/:id/attendees', [EventController, 'listAttendees'])
          .use(middleware.auth())

        // Ticket Type Routes
        router
          .post(':organizationId/events/:eventId/ticket-types', [TicketTypeController, 'create'])
          .use(middleware.auth())
        router
          .get(':organizationId/events/:eventId/ticket-types', [TicketTypeController, 'index'])
          .use(middleware.auth())
        router
          .get(':organizationId/events/:eventId/ticket-types/:id', [TicketTypeController, 'show'])
          .use(middleware.auth())
        router
          .put(':organizationId/events/:eventId/ticket-types/:id', [TicketTypeController, 'update'])
          .use(middleware.auth())
        router
          .delete(':organizationId/events/:eventId/ticket-types/:id', [
            TicketTypeController,
            'destroy',
          ])
          .use(middleware.auth())

        // New route for predefined ticket types
        router
          .get('ticket-types/predefined', [TicketTypeController, 'getPredefinedTypes'])
          .use(middleware.auth())

    })
      .prefix('organizations')

    // Public Event Routes
    router.get('events', [EventController, 'publicIndex'])
    router.get('events/:id', [EventController, 'publicShow'])
    router.get('events/:id/reviews', [ReviewController, 'index'])
    router.post('events/:id/reviews', [ReviewController, 'store']).use(middleware.auth())

    // Purchase Tickets Route
    router.post('events/:eventId/purchase', [OrderController, 'purchase']).use(middleware.auth())

    // Categories Route
    router.get('categories', [CategoryController, 'index'])

    // Payment Methods Route
    router.get('payment-methods', [PaymentMethodController, 'index'])

    // PawaPay Routes
    router.get('pawa-pay/active-configuration', [PawaPayController, 'getActiveConfiguration'])
    router.post('pawa-pay/deposit', [PawaPayController, 'createDeposit']).use(middleware.auth())
    router.post('pawa-pay/webhook', [PawaPayWebhookController, 'handleWebhook'])

    // Generic Upload Route
    router.post('upload', [UploadController, 'store']).use(middleware.auth())

    // Stripe Webhook
    router.post('stripe/webhook', [StripeWebhookController, 'handleWebhook'])
  })
  .prefix('api/v1')
