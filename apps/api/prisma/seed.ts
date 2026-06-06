import {
  PrismaClient,
  UserRole,
  CareStatus,
  MedicationFrequency,
  LogEntryType,
  DocumentType,
  BlueprintTriggerType,
  SubscriptionPlan,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CareSync database...');

  // ─── Clean existing data ──────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.shiftHandoff.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.futureBlueprint.deleteMany();
  await prisma.document.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.medicationLog.deleteMany();
  await prisma.medicationSchedule.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.vitalSign.deleteMany();
  await prisma.careLog.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.careRecipient.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.teamInvite.deleteMany();
  await prisma.careTeamMember.deleteMany();
  await prisma.careTeam.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.featureFlag.deleteMany();
  console.log('  ✓ Cleaned existing data');

  // ─── Feature flags ────────────────────────────────────────
  const featureFlags = await prisma.featureFlag.createMany({
    data: [
      {
        name: 'ai_care_planner',
        description: 'AI-powered care plan generation',
        isEnabled: false,
        rolloutPercent: 0,
        allowedPlans: [SubscriptionPlan.PROFESSIONAL, SubscriptionPlan.ENTERPRISE],
      },
      {
        name: 'ai_family_mediator',
        description: 'AI family conflict mediator',
        isEnabled: false,
        rolloutPercent: 0,
        allowedPlans: [SubscriptionPlan.PROFESSIONAL, SubscriptionPlan.ENTERPRISE],
      },
      {
        name: 'offline_mode',
        description: 'PWA offline sync capability',
        isEnabled: false,
        rolloutPercent: 0,
        allowedPlans: [
          SubscriptionPlan.BASIC,
          SubscriptionPlan.PROFESSIONAL,
          SubscriptionPlan.ENTERPRISE,
        ],
      },
      {
        name: 'shift_handoffs',
        description: 'Structured shift handoff reports',
        isEnabled: true,
        rolloutPercent: 100,
        allowedPlans: [
          SubscriptionPlan.FREE,
          SubscriptionPlan.BASIC,
          SubscriptionPlan.PROFESSIONAL,
          SubscriptionPlan.ENTERPRISE,
        ],
      },
      {
        name: 'document_vault',
        description: 'Secure document storage',
        isEnabled: true,
        rolloutPercent: 100,
        allowedPlans: [
          SubscriptionPlan.BASIC,
          SubscriptionPlan.PROFESSIONAL,
          SubscriptionPlan.ENTERPRISE,
        ],
      },
      {
        name: 'inventory_tracking',
        description: 'Supply inventory management',
        isEnabled: true,
        rolloutPercent: 100,
        allowedPlans: [
          SubscriptionPlan.FREE,
          SubscriptionPlan.BASIC,
          SubscriptionPlan.PROFESSIONAL,
          SubscriptionPlan.ENTERPRISE,
        ],
      },
    ],
  });
  console.log(`  ✓ Created ${featureFlags.count} feature flags`);

  // ─── Demo users ───────────────────────────────────────────
  const passwordHash = await bcrypt.hash('CareSync123!', 12);

  const narrissa = await prisma.user.create({
    data: {
      email: 'narrissa@caresync.demo',
      passwordHash,
      firstName: 'Narrissa',
      lastName: 'Demo',
      phone: '555-0100',
      emailVerified: new Date(),
    },
  });

  const marcus = await prisma.user.create({
    data: {
      email: 'marcus@caresync.demo',
      passwordHash,
      firstName: 'Marcus',
      lastName: 'Demo',
      phone: '555-0101',
      emailVerified: new Date(),
    },
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@caresync.demo',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Demo',
      phone: '555-0102',
      emailVerified: new Date(),
    },
  });

  const caregiver = await prisma.user.create({
    data: {
      email: 'caregiver@caresync.demo',
      passwordHash,
      firstName: 'Maria',
      lastName: 'Professional',
      phone: '555-0103',
      emailVerified: new Date(),
    },
  });
  console.log('  ✓ Created 4 demo users');

  // ─── Care team ────────────────────────────────────────────
  const careTeam = await prisma.careTeam.create({
    data: {
      name: 'The Turner Family Care Team',
      description: 'Coordinating care for Robert Turner',
      status: CareStatus.ACTIVE,
    },
  });

  await prisma.careTeamMember.createMany({
    data: [
      {
        careTeamId: careTeam.id,
        userId: narrissa.id,
        role: UserRole.PRIMARY_CAREGIVER,
        isAdmin: true,
      },
      { careTeamId: careTeam.id, userId: marcus.id, role: UserRole.FAMILY_MEMBER },
      { careTeamId: careTeam.id, userId: sarah.id, role: UserRole.MEDICAL_COORDINATOR },
      { careTeamId: careTeam.id, userId: caregiver.id, role: UserRole.SECONDARY_CAREGIVER },
    ],
  });

  // ─── Subscription ─────────────────────────────────────────
  await prisma.subscription.create({
    data: {
      careTeamId: careTeam.id,
      plan: SubscriptionPlan.FREE,
    },
  });
  console.log('  ✓ Created care team with 4 members');

  // ─── Care recipient ───────────────────────────────────────
  const recipient = await prisma.careRecipient.create({
    data: {
      careTeamId: careTeam.id,
      firstName: 'Robert',
      lastName: 'Turner',
      dateOfBirth: new Date('1942-03-15'),
      primaryDiagnosis: "Alzheimer's Disease (Advanced)",
      secondaryDiagnoses: ["Parkinson's Disease", 'Hypertension', 'Type 2 Diabetes'],
      allergies: ['Penicillin', 'Sulfa drugs'],
      bloodType: 'O+',
      weightLbs: 165,
      heightInches: 70,
      preferredHospital: 'Memorial General Hospital',
      preferredPhysician: 'Dr. Patricia Chen',
      physicianPhone: '555-0200',
      insuranceProvider: 'Medicare',
      medicareNumber: 'DEMO-123456A',
      dnrStatus: false,
      advanceDirective: true,
      mobilityStatus: 'Requires assistance — walker or wheelchair for longer distances',
      dietaryRestrictions: [
        'Low sodium',
        'Soft foods preferred',
        'No grapefruit (medication interaction)',
      ],
      notes:
        'Robert responds well to music from the 1960s. Becomes agitated in the late afternoon (sundowning). Prefers to be called "Bob".',
      status: CareStatus.ACTIVE,
    },
  });

  // ─── Emergency contacts ───────────────────────────────────
  await prisma.emergencyContact.createMany({
    data: [
      {
        recipientId: recipient.id,
        name: 'Narrissa Turner',
        relationship: 'Daughter-in-law (Primary Caregiver)',
        phone: '555-0100',
        priority: 1,
      },
      {
        recipientId: recipient.id,
        name: 'Marcus Turner',
        relationship: 'Son',
        phone: '555-0101',
        priority: 2,
      },
      {
        recipientId: recipient.id,
        name: 'Dr. Patricia Chen',
        relationship: 'Primary Physician',
        phone: '555-0200',
        priority: 3,
      },
      {
        recipientId: recipient.id,
        name: 'Memorial General Hospital',
        relationship: 'Preferred Hospital',
        phone: '555-0911',
        isLocalContact: false,
        priority: 4,
      },
    ],
  });
  console.log('  ✓ Created care recipient and emergency contacts');

  // ─── Medications ──────────────────────────────────────────
  const donepezil = await prisma.medication.create({
    data: {
      recipientId: recipient.id,
      name: 'Donepezil (Aricept)',
      dosage: '10',
      unit: 'mg',
      frequency: MedicationFrequency.DAILY,
      instructions: 'Give with evening meal. Monitor for nausea.',
      prescribedBy: 'Dr. Patricia Chen',
      pharmacy: 'CVS Pharmacy',
      pharmacyPhone: '555-0300',
      refillDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      pillsRemaining: 28,
      isActive: true,
      purpose: "Alzheimer's — slows cognitive decline",
      sideEffects: ['Nausea', 'Diarrhea', 'Insomnia', 'Muscle cramps'],
      scheduleTimes: {
        create: [{ scheduledTime: '18:00', label: 'Evening with dinner' }],
      },
    },
  });

  await prisma.medication.create({
    data: {
      recipientId: recipient.id,
      name: 'Carbidopa/Levodopa (Sinemet)',
      dosage: '25/100',
      unit: 'mg',
      frequency: MedicationFrequency.THREE_TIMES_DAILY,
      instructions: 'Give 30 minutes before meals. Do not crush. Watch for dyskinesia.',
      prescribedBy: 'Dr. Patricia Chen',
      isActive: true,
      purpose: "Parkinson's — controls motor symptoms",
      sideEffects: ['Nausea', 'Dizziness', 'Dyskinesia', 'Hallucinations'],
      scheduleTimes: {
        create: [
          { scheduledTime: '07:30', label: 'Morning — 30 min before breakfast' },
          { scheduledTime: '12:30', label: 'Noon — 30 min before lunch' },
          { scheduledTime: '17:30', label: 'Afternoon — 30 min before dinner' },
        ],
      },
    },
  });

  await prisma.medication.create({
    data: {
      recipientId: recipient.id,
      name: 'Lorazepam (Ativan)',
      dosage: '0.5',
      unit: 'mg',
      frequency: MedicationFrequency.AS_NEEDED,
      isPRN: true,
      prnReason: 'Severe agitation or anxiety episodes. Use only if behavioral interventions fail.',
      instructions:
        'PRN only. Document reason for administration. Notify Dr. Chen if used more than 3x in a week.',
      prescribedBy: 'Dr. Patricia Chen',
      isActive: true,
      purpose: 'Anxiety and agitation management',
      sideEffects: ['Drowsiness', 'Confusion', 'Fall risk increases'],
    },
  });
  console.log('  ✓ Created 3 medications with schedules');

  // ─── Sample care logs ─────────────────────────────────────
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  await prisma.careLog.createMany({
    data: [
      {
        recipientId: recipient.id,
        loggedBy: caregiver.id,
        type: LogEntryType.MEAL,
        occurredAt: yesterday,
        mealDescription: 'Breakfast — oatmeal with banana',
        mealAmount: 'full',
        notes: 'Good appetite this morning. Ate independently.',
      },
      {
        recipientId: recipient.id,
        loggedBy: caregiver.id,
        type: LogEntryType.WATER,
        occurredAt: yesterday,
        waterOz: 8,
      },
      {
        recipientId: recipient.id,
        loggedBy: caregiver.id,
        type: LogEntryType.MOOD,
        occurredAt: yesterday,
        moodRating: 4,
        moodDescription:
          'Good mood in morning. Started getting agitated around 4pm (sundowning). Music helped.',
      },
      {
        recipientId: recipient.id,
        loggedBy: narrissa.id,
        type: LogEntryType.BEHAVIORAL,
        occurredAt: twoDaysAgo,
        behaviorDescription:
          'Refused to take Carbidopa/Levodopa at noon dose. Became verbally agitated.',
        behaviorTrigger: 'Unknown — possibly pain or confusion',
        behaviorIntervention:
          'Waited 20 min, tried again with juice. Eventually accepted medication.',
      },
    ],
  });
  console.log('  ✓ Created sample care logs');

  // ─── Sample vital signs ───────────────────────────────────
  // (Vital readings live on the VitalSign model, not CareLog.)
  await prisma.vitalSign.create({
    data: {
      recipientId: recipient.id,
      recordedBy: narrissa.id,
      recordedAt: twoDaysAgo,
      bloodPressureSystolic: 138,
      bloodPressureDiastolic: 82,
      heartRate: 72,
      oxygenSaturation: 97,
    },
  });
  console.log('  ✓ Created sample vital signs');

  // ─── Tasks ────────────────────────────────────────────────
  const morningRoutineTask = await prisma.task.create({
    data: {
      recipientId: recipient.id,
      createdBy: narrissa.id,
      title: 'Morning care routine',
      description: 'Complete morning hygiene and medication administration',
      frequency: 'DAILY',
      dueTime: '08:00',
      isRecurring: true,
      priority: 1,
      category: 'Daily Care',
      instructions:
        '1. Help with bathroom/hygiene\n2. Assist with dressing\n3. Give Carbidopa/Levodopa (30 min before breakfast)\n4. Prepare and serve breakfast\n5. Give morning blood pressure reading\n6. Document mood and appetite',
      suppliesNeeded: ['Briefs', 'Wipes', 'Towel', 'Medications from cabinet A'],
    },
  });

  await prisma.taskAssignment.create({
    data: {
      taskId: morningRoutineTask.id,
      userId: caregiver.id,
      status: 'PENDING',
      dueDate: new Date(),
    },
  });

  await prisma.task.create({
    data: {
      recipientId: recipient.id,
      createdBy: narrissa.id,
      title: 'CVS medication refill pickup',
      description: 'Donepezil refill ready in 14 days',
      frequency: 'ONE_TIME',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      priority: 2,
      category: 'Medications',
      instructions:
        'Pick up Donepezil refill from CVS on Main St. Rx # on file. Call ahead: 555-0300.',
    },
  });
  console.log('  ✓ Created 2 tasks with assignments');

  // ─── Upcoming appointment ─────────────────────────────────
  await prisma.appointment.create({
    data: {
      recipientId: recipient.id,
      title: 'Neurology follow-up — Dr. Chen',
      provider: 'Dr. Patricia Chen',
      specialty: 'Neurology',
      location: 'Memorial Medical Center, Neurology Clinic',
      address: '100 Medical Drive, Suite 400',
      phone: '555-0200',
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      durationMinutes: 45,
      notes: 'Bring updated medication list and recent care logs.',
      preparationInstructions:
        'No medication changes in the 48 hours before appointment. Bring insurance card. Allow 90 minutes for parking and wait time.',
      transportation: 'Family vehicle',
      transportedBy: 'Narrissa',
    },
  });
  console.log('  ✓ Created upcoming appointment');

  // ─── Inventory ────────────────────────────────────────────
  await prisma.inventoryItem.createMany({
    data: [
      {
        recipientId: recipient.id,
        name: 'Adult briefs (size L)',
        category: 'hygiene',
        location: 'Cabinet A — top shelf',
        currentStock: 24,
        minimumStock: 12,
        unit: 'units',
        supplierName: 'Amazon Subscribe & Save',
      },
      {
        recipientId: recipient.id,
        name: 'Bed pads / chux',
        category: 'hygiene',
        location: 'Cabinet A — bottom shelf',
        currentStock: 15,
        minimumStock: 10,
        unit: 'units',
      },
      {
        recipientId: recipient.id,
        name: 'Disposable gloves (M)',
        category: 'medical',
        location: 'Cabinet B',
        currentStock: 48,
        minimumStock: 20,
        unit: 'pairs',
      },
      {
        recipientId: recipient.id,
        name: 'Ensure nutrition shakes',
        category: 'nutrition',
        location: 'Kitchen pantry',
        currentStock: 6,
        minimumStock: 12,
        unit: 'cans',
        notes: 'LOW — reorder needed',
      },
      {
        recipientId: recipient.id,
        name: 'Pressure relief mattress pad',
        category: 'equipment',
        location: "Bob's bedroom",
        currentStock: 1,
        minimumStock: 1,
        unit: 'units',
      },
    ],
  });
  console.log('  ✓ Created 5 inventory items');

  // ─── Future blueprint ─────────────────────────────────────
  await prisma.futureBlueprint.create({
    data: {
      recipientId: recipient.id,
      title: 'If Bob falls — emergency response plan',
      trigger: BlueprintTriggerType.FALL,
      description: 'Step-by-step plan if Bob falls and cannot get up or appears injured.',
      steps: [
        {
          order: 1,
          action: 'Do not move Bob — assess for injury',
          responsible: 'Whoever is present',
          notes: 'Check for head injury, unnatural limb position, or inability to bear weight',
        },
        {
          order: 2,
          action: 'Call 911 if any injury suspected',
          responsible: 'Whoever is present',
          notes: 'Always err on the side of calling. Better safe than sorry.',
        },
        {
          order: 3,
          action: 'Call Narrissa immediately',
          responsible: 'Whoever is present',
          notes: 'Phone: 555-0100. Even if 911 was called.',
        },
        {
          order: 4,
          action: 'Document the fall in CareSync',
          responsible: 'First available caregiver',
          notes: 'Location, time, what happened, injuries, actions taken',
        },
        {
          order: 5,
          action: 'Notify Dr. Chen within 24 hours',
          responsible: 'Narrissa or Sarah',
          notes: 'Even minor falls should be reported. Phone: 555-0200',
        },
      ],
      contacts: [
        { name: 'Narrissa Turner', phone: '555-0100', role: 'Primary Caregiver' },
        { name: 'Dr. Patricia Chen', phone: '555-0200', role: 'Primary Physician' },
        { name: 'Emergency Services', phone: '911', role: 'Emergency' },
      ],
      isActive: true,
    },
  });
  console.log('  ✓ Created future care blueprint');

  // ─── Shift handoff example ────────────────────────────────
  await prisma.shiftHandoff.create({
    data: {
      recipientId: recipient.id,
      giverId: caregiver.id,
      receiverId: narrissa.id,
      shiftDate: new Date(),
      shiftType: 'morning',
      summary:
        'Good morning overall. Bob was cooperative and in decent spirits until about 3pm when sundowning started. Music intervention worked well. One PRN medication consideration (did not administer).',
      mealsGiven: 'Breakfast: full bowl of oatmeal + banana. Lunch: half a sandwich + soup.',
      waterIntake: '24oz by end of shift',
      medicationsGiven: 'Carbidopa/Levodopa 7:30am ✓, 12:30pm ✓. Donepezil not yet due.',
      medicationsMissed: 'None',
      bowelMovements: 'One BM after breakfast, normal',
      sleep: 'Slept well overnight per previous handoff',
      mood: 'Good in morning (4/5). Agitated 3-4pm (2/5). Settled after music.',
      painLevel: 2,
      pendingTasks: 'Evening Carbidopa/Levodopa at 5:30pm. Evening Donepezil at 6pm with dinner.',
      suppliesLow: ['Ensure nutrition shakes — only 6 left, needs reorder'],
      urgentItems: 'None urgent. Watch for sundowning again around 3pm.',
      generalNotes:
        'Bob asked about his wife Patricia several times today. Gentle redirection worked. He enjoyed the Frank Sinatra playlist.',
    },
  });
  console.log('  ✓ Created sample shift handoff');

  console.log('\n✅ Seed complete.');
  console.log('\nDemo login credentials (all use password: CareSync123!):');
  console.log('  Primary caregiver: narrissa@caresync.demo');
  console.log('  Family member:     marcus@caresync.demo');
  console.log('  Medical coord:     sarah@caresync.demo');
  console.log('  Professional:      caregiver@caresync.demo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
