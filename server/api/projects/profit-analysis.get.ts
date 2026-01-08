export default defineEventHandler(async () => {
  const projects = await prisma.project.findMany({
    where: {
      status: {
        in: ['APPROVED', 'PROCUREMENT', 'ONGOING', 'COMPLETED', 'PAID', 'CLOSED'],
      },
    },
    include: {
      customer: true,
      items: true,
      expenses: true,
      technicians: {
        include: {
          technician: {
            include: {
              payments: {
                where: {
                  projectId: {
                    not: null,
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return projects
})
