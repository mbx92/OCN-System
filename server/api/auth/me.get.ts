import jwt from 'jsonwebtoken'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const token = getCookie(event, 'auth-token') || getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (!token) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Token tidak ditemukan',
        })
    }

    const config = useRuntimeConfig()

    try {
        // Verify token
        const payload = jwt.verify(token, config.jwtSecret) as { userId: string }

        // Check session validity
        const session = await prisma.session.findUnique({
            where: { token },
            include: {
                user: {
                    include: {
                        technicianProfile: true,
                    },
                },
            },
        })

        if (!session || session.expiresAt < new Date()) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Sesi telah berakhir',
            })
        }

        if (!session.user.isActive) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Akun tidak aktif',
            })
        }

        // Update last activity
        await prisma.session.update({
            where: { id: session.id },
            data: { lastActivity: new Date() },
        })

        return {
            user: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                username: session.user.username,
                role: session.user.role,
                technicianId: session.user.technicianProfile?.id,
            },
        }
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Token tidak valid',
            })
        }
        throw error
    }
})
