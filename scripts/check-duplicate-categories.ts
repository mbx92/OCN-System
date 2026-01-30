import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Checking Product Categories ===\n')

  // Get all categories with count
  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  })

  console.log('All Categories:')
  console.log('-'.repeat(50))
  categories.forEach(c => {
    console.log(`${c.category || '(null)'}: ${c._count.category} products`)
  })

  // Check for potential duplicates (case-insensitive)
  console.log('\n=== Checking Potential Duplicates (Case-Insensitive) ===\n')

  const categoryNames = categories.map(c => c.category?.toLowerCase() || '')
  const duplicates = categoryNames.filter((item, index) => categoryNames.indexOf(item) !== index)

  if (duplicates.length > 0) {
    console.log('Potential duplicate categories found:')
    const uniqueDuplicates = [...new Set(duplicates)]
    for (const dup of uniqueDuplicates) {
      const matches = categories.filter(c => c.category?.toLowerCase() === dup)
      console.log(`\n  Similar to "${dup}":`)
      matches.forEach(m => console.log(`    - "${m.category}" (${m._count.category} products)`))
    }
  } else {
    console.log('No case-insensitive duplicates found.')
  }

  // Check for similar categories (with extra spaces or typos)
  console.log('\n=== Checking Categories with Extra Spaces ===\n')
  const categoriesWithSpaces = categories.filter(
    c => c.category && (c.category !== c.category.trim() || c.category.includes('  '))
  )

  if (categoriesWithSpaces.length > 0) {
    console.log('Categories with extra spaces:')
    categoriesWithSpaces.forEach(c => {
      console.log(`  - "${c.category}" (${c._count.category} products)`)
    })
  } else {
    console.log('No categories with extra spaces found.')
  }

  // List similar categories (Levenshtein distance check - simple approach)
  console.log('\n=== Categories Summary ===\n')
  const sortedCategories = [...categories].sort((a, b) =>
    (a.category || '').localeCompare(b.category || '')
  )
  sortedCategories.forEach(c => {
    console.log(`"${c.category || '(null)'}" - ${c._count.category} products`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
