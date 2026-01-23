import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Mencari transaksi sisa upah teknisi...')

    // Cari transaksi cashflow yang merupakan sisa upah teknisi
    const transactions = await prisma.cashTransaction.findMany({
      where: {
        type: 'INCOME',
        category: 'OTHER',
        description: {
          contains: 'Sisa upah teknisi',
        },
        referenceType: 'Project',
      },
      orderBy: {
        date: 'desc',
      },
    })

    console.log(`\n✅ Ditemukan ${transactions.length} transaksi sisa upah teknisi\n`)

    if (transactions.length === 0) {
      console.log('Tidak ada transaksi yang perlu diperbaiki.')
      return
    }

    // Tampilkan data yang akan diperbaiki
    console.log('📋 Data yang akan diperbaiki:')
    console.log('='.repeat(100))

    for (const tx of transactions) {
      const currentDate = tx.date
      const projectDate = tx.project?.completedAt || tx.project?.endDate

      console.log(`\nID: ${tx.id}`)
      console.log(`Proyek: ${tx.project?.projectNumber || 'N/A'}`)
      console.log(`Deskripsi: ${tx.description}`)
      console.log(`Jumlah: Rp ${tx.amount.toLocaleString('id-ID')}`)
      console.log(`Tanggal Saat Ini: ${currentDate.toLocaleDateString('id-ID')}`)
      console.log(
        `Tanggal Project (completedAt/endDate): ${projectDate ? projectDate.toLocaleDateString('id-ID') : 'N/A'}`
      )
      console.log(`Status Project: ${tx.project?.status || 'N/A'}`)

      if (projectDate && currentDate.getTime() !== projectDate.getTime()) {
        console.log(
          `⚠️  PERLU UPDATE: ${currentDate.toLocaleDateString('id-ID')} → ${projectDate.toLocaleDateString('id-ID')}`
        )
      } else if (!projectDate) {
        console.log(`⚠️  WARNING: Project tidak punya endDate`)
      } else {
        console.log(`✅ Sudah sesuai`)
      }
    }

    console.log('\n' + '='.repeat(100))

    // Konfirmasi
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const answer = await new Promise<string>(resolve => {
      rl.question('\n❓ Lanjutkan update data? (yes/no): ', resolve)
    })
    rl.close()

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Update dibatalkan.')
      return
    }

    // Update data
    console.log('\n🔄 Memulai update...\n')
    let updated = 0
    let skipped = 0

    for (const tx of transactions) {
      // Ambil data project
      let project = null
      if (tx.referenceId) {
        project = await prisma.project.findUnique({
          where: { id: tx.referenceId },
          select: {
            id: true,
            projectNumber: true,
            endDate: true,
            status: true,
          },
        })
      }

      const projectDate = project?.endDate

      if (projectDate && tx.date.getTime() !== projectDate.getTime()) {
        await prisma.cashTransaction.update({
          where: { id: tx.id },
          data: {
            date: projectDate,
          },
        })
        console.log(
          `✅ Updated: ${tx.id} - ${project?.projectNumber || tx.reference} (${projectDate.toLocaleDateString('id-ID')})`
        )
        updated++
      } else {
        console.log(
          `⏭️  Skipped: ${tx.id} - ${project?.projectNumber || tx.reference || 'N/A'} (sudah sesuai atau tidak ada tanggal project)`
        )
        skipped++
      }
    }

    console.log('\n' + '='.repeat(100))
    console.log(`\n✨ Selesai!`)
    console.log(`   - ${updated} transaksi berhasil diupdate`)
    console.log(`   - ${skipped} transaksi diskip`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
