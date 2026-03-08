// projecthub/lib/db.ts
// import { PrismaClient } from '@prisma/client';
// import { PrismaPg } from '@prisma/adapter-pg';

// const adapter = new PrismaPg({
//   connectionString: process.env.DATABASE_URL
// });

// const globalForPrisma = global as unknown as { prisma: PrismaClient };

// export const prisma =
//   globalForPrisma.prisma ||
//   new PrismaClient({ adapter });

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;

let prisma: PrismaClient;

if (connectionString) {
    // RUNTIME: We have a real URL, use the adapter
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
} else {
    // BUILD-TIME: No URL found (Docker build phase)
    // We initialize without the adapter to prevent the "base" error
    prisma = globalForPrisma.prisma || new PrismaClient();
}

export { prisma };

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;