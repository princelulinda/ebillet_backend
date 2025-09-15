import vine from '@vinejs/vine'

export const uploadValidator = vine.compile(
  vine.object({
    file: vine.file({
      size: '10mb', // Adjust size as needed
      extnames: ['jpg', 'png', 'gif', 'pdf', 'doc', 'docx'], // Adjust extensions as needed
    }),
  })
)
