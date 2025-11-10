#!/usr/bin/env node
/**
 * verifyAllUsers.js
 * Marks all existing users as email verified and clears any legacy verification codes.
 *
 * Usage:
 *   node src/scripts/verifyAllUsers.js --dry-run   (shows what WOULD change)
 *   node src/scripts/verifyAllUsers.js             (applies changes)
 *   node src/scripts/verifyAllUsers.js --older-than-days 30  (only users created > 30 days ago)
 *
 * Safety notes:
 * - This operation is irreversible for verification state unless you manually revert documents.
 * - Recommended to run with --dry-run first and capture output.
 */
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import '../models/Role.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, olderThanDays: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--older-than-days') {
      const v = parseInt(args[i + 1], 10); i++; opts.olderThanDays = isNaN(v) ? null : v;
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  await connectDB();

  const criteria = { $or: [ { isEmailVerified: false }, { isEmailVerified: { $exists: false } } ] };
  if (opts.olderThanDays) {
    const cutoff = new Date(Date.now() - opts.olderThanDays * 24 * 60 * 60 * 1000);
    criteria.createdAt = { $lt: cutoff };
  }

  const candidates = await User.find(criteria).select('+verificationCode +verificationCodeExpiry');
  const totalCandidates = candidates.length;

  let legacyCodeCount = 0;
  let expiredLinkCount = 0;
  let noTokenCount = 0;

  for (const u of candidates) {
    if (!u.verificationCode && !u.verificationCodeExpiry) noTokenCount++;
    else if (u.verificationCode && /^\d{6}$/.test(u.verificationCode)) legacyCodeCount++;
    else if (u.verificationCodeExpiry && new Date() > u.verificationCodeExpiry) expiredLinkCount++;
  }

  console.log('--- Verify All Users Migration ---');
  console.log('Dry Run:', opts.dryRun);
  console.log('Older Than Days Filter:', opts.olderThanDays ?? 'NONE');
  console.table([
    { metric: 'candidates', value: totalCandidates },
    { metric: 'legacy_codes', value: legacyCodeCount },
    { metric: 'expired_links', value: expiredLinkCount },
    { metric: 'no_token', value: noTokenCount }
  ]);

  if (opts.dryRun) {
    console.log('Exiting (dry run).');
    process.exit(0);
  }

  // Perform bulk update
  const bulkOps = candidates.map(u => ({
    updateOne: {
      filter: { _id: u._id },
      update: {
        $set: { isEmailVerified: true },
        $unset: { verificationCode: '', verificationCodeExpiry: '' }
      }
    }
  }));

  if (bulkOps.length === 0) {
    console.log('No users required updating.');
    process.exit(0);
  }

  const result = await User.bulkWrite(bulkOps, { ordered: false });
  console.log('Bulk write result:', {
    matched: result.matchedCount,
    modified: result.modifiedCount
  });

  const remaining = await User.countDocuments({ $or: [ { isEmailVerified: false }, { isEmailVerified: { $exists: false } } ] });
  console.log('Remaining unverified users after migration:', remaining);

  process.exit(0);
}

main().catch(err => { console.error('Migration failed:', err); process.exit(1); });
