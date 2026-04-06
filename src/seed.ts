/**
 * Seed script — wipes and repopulates the database with realistic Ukrainian data.
 * Run: npm run seed
 */
import mongoose, { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

import { UserSchema } from './users/schemas/user.schema';
import { ClientSchema } from './clients/schemas/client.schema';
import { ServiceSchema } from './services/schemas/service.schema';
import { DocumentSchema } from './documents/schemas/document.schema';
import { Role } from './common/enums/role.enum';
import { ServiceType } from './services/enums/service-type.enum';
import { ServiceStatus } from './services/enums/service-status.enum';
import { DocumentStatus } from './documents/enums/document-status.enum';
import { VerificationStatus } from './registry/interfaces/registry-response.interface';

// ─── RNG ────────────────────────────────────────────────────────────────────

let seed = 42;
function rand(): number {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return (seed >>> 0) / 0xffffffff;
}
function ri(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rand() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// ─── DATA TABLES ────────────────────────────────────────────────────────────

const MALE_FIRST = [
  'Іван', 'Олексій', 'Михайло', 'Петро', 'Андрій', 'Сергій', 'Дмитро',
  'Василь', 'Олег', 'Тарас', 'Богдан', 'Юрій', 'Максим', 'Денис', 'Роман',
  'Артем', 'Ігор', 'Павло', 'Микола', 'Владислав', 'Євген', 'Антон',
  'Руслан', 'Віктор', 'Олександр', 'Степан', 'Григорій', 'Леонід', 'Федір',
];

const FEMALE_FIRST = [
  'Оксана', 'Наталія', 'Людмила', 'Ірина', 'Тетяна', 'Ольга', 'Марія',
  'Ганна', 'Юлія', 'Леся', 'Валентина', 'Надія', 'Катерина', 'Вікторія',
  'Дарина', 'Аліна', 'Світлана', 'Галина', 'Христина', 'Мирослава',
  'Уляна', 'Лариса', 'Інна', 'Зоя', 'Лідія', 'Розалія', 'Ніна', 'Тамара',
];

const LAST_NAMES = [
  'Коваленко', 'Петренко', 'Сидоренко', 'Бондаренко', 'Ткаченко',
  'Кравченко', 'Шевченко', 'Мороз', 'Лисенко', 'Гончаренко', 'Остапенко',
  'Савченко', 'Мельник', 'Поліщук', 'Романенко', 'Хоменко', 'Павленко',
  'Яременко', 'Власенко', 'Руденко', 'Клименко', 'Семенченко', 'Даниленко',
  'Іваненко', 'Карпенко', 'Захаренко', 'Пономаренко', 'Марченко',
  'Кириченко', 'Федоренко', 'Тимченко', 'Луценко', 'Соколенко', 'Кулик',
  'Гнатенко', 'Бабенко', 'Олійник', 'Дяченко', 'Мазуренко', 'Єременко',
  'Левченко', 'Гриценко', 'Науменко', 'Назаренко', 'Куценко', 'Бублик',
  'Черненко', 'Білоус', 'Король', 'Гладченко',
];

interface CityData {
  city: string;
  postalCode: string;
  streets: string[];
}

const CITIES: CityData[] = [
  {
    city: 'Київ', postalCode: '01001',
    streets: ['вул. Хрещатик', 'вул. Велика Васильківська', 'бул. Лесі Українки', 'вул. Саксаганського', 'пр. Перемоги', 'вул. Антоновича', 'вул. Борщагівська', 'вул. Полтавська'],
  },
  {
    city: 'Харків', postalCode: '61001',
    streets: ['пр. Науки', 'вул. Сумська', 'вул. Пушкінська', 'вул. Клочківська', 'пр. Московський', 'вул. Академіка Павлова', 'вул. Гоголя'],
  },
  {
    city: 'Одеса', postalCode: '65001',
    streets: ['вул. Дерибасівська', 'вул. Пушкінська', 'вул. Рішельєвська', 'пр. Шевченка', 'вул. Катерининська', 'вул. Грецька', 'вул. Єврейська'],
  },
  {
    city: 'Дніпро', postalCode: '49001',
    streets: ['вул. Робоча', 'пр. Дмитра Яворницького', 'вул. Виконкомівська', 'вул. Короленка', 'вул. Гоголя', 'пр. Гагаріна', 'вул. Глінки'],
  },
  {
    city: 'Запоріжжя', postalCode: '69001',
    streets: ['пр. Соборний', 'вул. Металургів', 'вул. Незалежної України', 'бул. Центральний', 'вул. Перемоги', 'вул. Лермонтова'],
  },
  {
    city: 'Львів', postalCode: '79001',
    streets: ['пл. Ринок', 'вул. Городоцька', 'вул. Личаківська', 'вул. Шевченка', 'вул. Сахарова', 'вул. Франка', 'вул. Дорошенка'],
  },
  {
    city: 'Вінниця', postalCode: '21001',
    streets: ['вул. Соборна', 'вул. Козицького', 'вул. Пирогова', 'вул. Київська', 'вул. Грушевського', 'вул. Хмельницьке шосе'],
  },
  {
    city: 'Полтава', postalCode: '36001',
    streets: ['вул. Соборності', 'вул. Пушкіна', 'вул. Шевченка', 'вул. Монастирська', 'вул. Котляревського', 'пр. Першотравневий'],
  },
  {
    city: 'Черкаси', postalCode: '18001',
    streets: ['бул. Шевченка', 'вул. Хрещатик', 'вул. Смілянська', 'вул. Байди Вишневецького', 'вул. Благовісна'],
  },
  {
    city: 'Суми', postalCode: '40001',
    streets: ['вул. Харківська', 'вул. Петропавлівська', 'вул. Троїцька', 'пр. Шевченка', 'вул. Кооперативна'],
  },
  {
    city: 'Житомир', postalCode: '10001',
    streets: ['вул. Велика Бердичівська', 'вул. Київська', 'вул. Михайлівська', 'пл. Корольова', 'вул. Лесі Українки'],
  },
  {
    city: 'Хмельницький', postalCode: '29001',
    streets: ['вул. Проскурівська', 'вул. Шевченка', 'вул. Гагаріна', 'пл. Незалежності', 'вул. Театральна'],
  },
  {
    city: 'Рівне', postalCode: '33001',
    streets: ['вул. Соборна', 'вул. Мазепи', 'вул. Симона Петлюри', 'пр. Миру', 'вул. Київська'],
  },
  {
    city: 'Тернопіль', postalCode: '46001',
    streets: ['вул. Руська', 'бул. Шевченка', 'вул. Микулинецька', 'вул. Медова', 'пр. Злуки'],
  },
  {
    city: 'Луцьк', postalCode: '43001',
    streets: ['вул. Лесі Українки', 'пр. Волі', 'вул. Шопена', 'вул. Кривий Вал', 'вул. Потебні'],
  },
  {
    city: 'Івано-Франківськ', postalCode: '76001',
    streets: ['вул. Незалежності', 'вул. Грушевського', 'вул. Галицька', 'вул. Сахарова', 'вул. Степана Бандери'],
  },
  {
    city: 'Чернівці', postalCode: '58001',
    streets: ['вул. Головна', 'вул. Університетська', 'вул. Кобилянської', 'вул. Федьковича', 'пл. Центральна'],
  },
  {
    city: 'Чернігів', postalCode: '14001',
    streets: ['вул. Мира', 'пр. Перемоги', 'вул. Рокосовського', 'вул. Шевченка', 'вул. Попудренка'],
  },
  {
    city: 'Кропивницький', postalCode: '25001',
    streets: ['вул. Велика Перспективна', 'пр. Університетський', 'вул. Леніна', 'вул. Гагаріна', 'вул. Тимірязєва'],
  },
  {
    city: 'Ужгород', postalCode: '88001',
    streets: ['вул. Народна', 'вул. Капушанська', 'пл. Жупанатська', 'вул. Загорська', 'вул. Волошина'],
  },
];

const EMAIL_DOMAINS = ['gmail.com', 'ukr.net', 'i.ua', 'meta.ua', 'outlook.com'];

const SERVICE_DESCRIPTIONS: Record<ServiceType, string[]> = {
  [ServiceType.DEED]: [
    'Посвідчення договору купівлі-продажу квартири',
    'Посвідчення договору купівлі-продажу земельної ділянки',
    'Посвідчення договору дарування нерухомого майна',
    'Посвідчення договору дарування частки у квартирі',
    'Посвідчення іпотечного договору',
    'Посвідчення договору купівлі-продажу автомобіля',
    'Посвідчення договору купівлі-продажу гаражу',
    'Посвідчення договору купівлі-продажу нежитлового приміщення',
  ],
  [ServiceType.POWER_OF_ATTORNEY]: [
    'Посвідчення довіреності на право розпорядження нерухомістю',
    'Посвідчення генеральної довіреності на ведення справ',
    'Посвідчення довіреності на представництво в суді',
    'Посвідчення довіреності на отримання пенсії',
    'Посвідчення довіреності на управління автомобілем',
    'Посвідчення довіреності на отримання документів',
    'Посвідчення довіреності на здійснення банківських операцій',
  ],
  [ServiceType.WILL]: [
    'Посвідчення заповіту на квартиру',
    'Посвідчення заповіту на земельну ділянку',
    'Посвідчення заповіту на все майно',
    'Посвідчення секретного заповіту',
    'Посвідчення заповіту з умовою',
    'Внесення змін до раніше посвідченого заповіту',
  ],
  [ServiceType.CERTIFICATION]: [
    'Засвідчення вірності копії паспорта',
    'Засвідчення вірності копії документа про освіту',
    'Засвідчення підпису на заяві',
    'Засвідчення вірності перекладу документа',
    'Засвідчення часу пред\'явлення документа',
    'Засвідчення вірності копії свідоцтва про народження',
    'Засвідчення підпису на банківській картці',
  ],
  [ServiceType.CONTRACT]: [
    'Посвідчення шлюбного договору',
    'Посвідчення договору позики',
    'Посвідчення договору застави',
    'Посвідчення договору про поділ спільного майна',
    'Посвідчення договору про встановлення сервітуту',
    'Посвідчення договору оренди нерухомості',
    'Посвідчення попереднього договору купівлі-продажу',
  ],
  [ServiceType.AFFIDAVIT]: [
    'Посвідчення заяви про відмову від спадщини',
    'Посвідчення заяви про надання згоди на виїзд дитини за кордон',
    'Посвідчення заяви про відмову від частки у спільному майні',
    'Посвідчення заяви про видачу дубліката документа',
    'Посвідчення заяви про прийняття спадщини',
    'Посвідчення заяви про відмову від приватизації',
  ],
  [ServiceType.OTHER]: [
    'Вчинення виконавчого напису на борговому документі',
    'Нотаріальний переклад документів з іноземної мови',
    'Зберігання документів та цінних паперів',
    'Посвідчення морського протесту',
    'Вчинення протесту векселя',
    'Передача заяв фізичних та юридичних осіб',
  ],
};

const FEE_RANGES: Record<ServiceType, [number, number]> = {
  [ServiceType.DEED]:              [150000, 500000],
  [ServiceType.POWER_OF_ATTORNEY]: [40000,  150000],
  [ServiceType.WILL]:              [80000,  300000],
  [ServiceType.CERTIFICATION]:     [10000,  50000],
  [ServiceType.CONTRACT]:          [80000,  400000],
  [ServiceType.AFFIDAVIT]:         [25000,  80000],
  [ServiceType.OTHER]:             [30000,  200000],
};

const DOC_TITLES: Record<ServiceType, string[]> = {
  [ServiceType.DEED]:              ['Нотаріальний акт про відчуження майна', 'Акт про правочин з нерухомістю'],
  [ServiceType.POWER_OF_ATTORNEY]: ['Нотаріальний акт — довіреність', 'Документ про уповноваження'],
  [ServiceType.WILL]:              ['Нотаріально посвідчений заповіт', 'Заповіт'],
  [ServiceType.CERTIFICATION]:     ['Нотаріальне засвідчення', 'Акт засвідчення'],
  [ServiceType.CONTRACT]:          ['Нотаріально посвідчений договір', 'Акт про договір сторін'],
  [ServiceType.AFFIDAVIT]:         ['Нотаріально посвідчена заява', 'Акт — заява'],
  [ServiceType.OTHER]:             ['Нотаріальний акт', 'Нотаріальне провадження'],
};

const STATUS_WEIGHTS = [
  { status: ServiceStatus.COMPLETED,   weight: 55 },
  { status: ServiceStatus.IN_PROGRESS, weight: 20 },
  { status: ServiceStatus.PENDING,     weight: 18 },
  { status: ServiceStatus.CANCELLED,   weight: 7 },
];

function weightedPick<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function randomDate(from: Date, to: Date): Date {
  return new Date(from.getTime() + rand() * (to.getTime() - from.getTime()));
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function generateNationalId(usedIds: Set<string>): string {
  let id: string;
  do {
    id = String(ri(1000000000, 9999999999));
  } while (usedIds.has(id));
  usedIds.add(id);
  return id;
}

function generateDocNumber(counter: number, date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `NOT/${y}/${m}/${d}/${String(counter).padStart(5, '0')}`;
}

function generateDocContent(data: {
  documentNumber: string;
  title: string;
  notaryName: string;
  generatedAt: Date;
  client: { firstName: string; lastName: string; nationalId: string; dateOfBirth: Date; address: string; phone: string; email?: string };
  services: { type: ServiceType; description: string; feeAmount: number; feeCurrency: string; confirmedAt?: Date }[];
}): string {
  const sep = '='.repeat(60);
  const thin = '-'.repeat(60);

  const serviceLines = data.services
    .map((s, i) => {
      const fee = (s.feeAmount / 100).toFixed(2);
      const confirmed = s.confirmedAt
        ? `  Підтверджено: ${formatDate(s.confirmedAt)}`
        : '  Статус: очікує підтвердження';
      return [`  ${i + 1}. [${s.type}]`, `     ${s.description}`, `     Вартість: ${fee} ${s.feeCurrency}`, confirmed].join('\n');
    })
    .join('\n\n');

  const total = data.services.reduce((s, x) => s + x.feeAmount, 0);
  const currency = data.services[0]?.feeCurrency ?? 'UAH';

  return [
    sep,
    'НОТАРІАЛЬНИЙ ДОКУМЕНТ',
    sep,
    '',
    `Номер документа : ${data.documentNumber}`,
    `Назва           : ${data.title}`,
    `Дата складення  : ${formatDate(data.generatedAt)}`,
    `Нотаріус        : ${data.notaryName}`,
    '',
    thin,
    'КЛІЄНТ',
    thin,
    `Повне ім'я      : ${data.client.lastName} ${data.client.firstName}`,
    `РНОКПП         : ${data.client.nationalId}`,
    `Дата народження : ${formatDate(data.client.dateOfBirth)}`,
    `Адреса          : ${data.client.address}`,
    `Телефон         : ${data.client.phone}`,
    data.client.email ? `Email           : ${data.client.email}` : null,
    '',
    thin,
    'ПОСЛУГИ',
    thin,
    serviceLines,
    '',
    thin,
    `ЗАГАЛЬНА СУМА   : ${(total / 100).toFixed(2)} ${currency}`,
    thin,
    '',
    sep,
    'Підпис нотаріуса: ____________________________',
    '',
    'Дата: ________________',
    sep,
  ]
    .filter((l) => l !== null)
    .join('\n');
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/notary-crm';
  console.log(`Connecting to ${uri} …`);
  await mongoose.connect(uri);

  const UserModel      = mongoose.model('User',           UserSchema);
  const ClientModel    = mongoose.model('Client',         ClientSchema);
  const ServiceModel   = mongoose.model('Service',        ServiceSchema);
  const DocumentModel  = mongoose.model('NotaryDocument', DocumentSchema);

  // ── Wipe ──────────────────────────────────────────────────────────────────
  console.log('Clearing existing data …');
  await Promise.all([
    UserModel.deleteMany({}),
    ClientModel.deleteMany({}),
    ServiceModel.deleteMany({}),
    DocumentModel.deleteMany({}),
  ]);

  // ── Users ─────────────────────────────────────────────────────────────────
  console.log('Creating 20 users …');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const notaryNames = [
    { name: 'Ірина Коваленко',  email: 'i.kovalenko@notary.ua'  },
    { name: 'Петро Гончаренко', email: 'p.goncharenko@notary.ua' },
    { name: 'Оксана Мороз',     email: 'o.moroz@notary.ua'       },
  ];

  const assistantNames = [
    { name: 'Андрій Бондаренко',   email: 'a.bondarenko@notary.ua'   },
    { name: 'Наталія Ткаченко',    email: 'n.tkachenko@notary.ua'     },
    { name: 'Дмитро Шевченко',     email: 'd.shevchenko@notary.ua'    },
    { name: 'Людмила Остапенко',   email: 'l.ostapenko@notary.ua'     },
    { name: 'Михайло Савченко',    email: 'm.savchenko@notary.ua'     },
    { name: 'Тетяна Лисенко',      email: 't.lysenko@notary.ua'       },
    { name: 'Юрій Кравченко',      email: 'y.kravchenko@notary.ua'    },
    { name: 'Ольга Романенко',     email: 'o.romanenko@notary.ua'     },
    { name: 'Сергій Мельник',      email: 's.melnyk@notary.ua'        },
    { name: 'Марія Руденко',       email: 'm.rudenko@notary.ua'       },
    { name: 'Олег Павленко',       email: 'o.pavlenko@notary.ua'      },
    { name: 'Валентина Хоменко',   email: 'v.khomenko@notary.ua'      },
    { name: 'Артем Карпенко',      email: 'a.karpenko@notary.ua'      },
    { name: 'Ірина Федоренко',     email: 'i.fedorenko@notary.ua'     },
    { name: 'Денис Кириченко',     email: 'd.kyrychenko@notary.ua'    },
    { name: 'Надія Клименко',      email: 'n.klymenko@notary.ua'      },
    { name: 'Роман Тимченко',      email: 'r.tymchenko@notary.ua'     },
  ];

  const userDocs = [
    ...notaryNames.map((u) => ({ ...u, role: Role.NOTARY,    isActive: true, password: passwordHash })),
    ...assistantNames.map((u) => ({ ...u, role: Role.ASSISTANT, isActive: true, password: passwordHash })),
  ];

  const insertedUsers = await UserModel.insertMany(userDocs);
  const notaryUsers    = insertedUsers.filter((u) => u.role === Role.NOTARY);
  const allUsers       = insertedUsers;

  console.log(`  ✓ ${insertedUsers.length} users (password for all: Password123!)`);

  // ── Clients ───────────────────────────────────────────────────────────────
  console.log('Creating 2 000 clients …');

  const usedIds = new Set<string>();
  const now = new Date();
  const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
  const eighteenYearsAgo = new Date(now.getFullYear() - 18, 0, 1);
  const eightyYearsAgo  = new Date(now.getFullYear() - 80, 0, 1);

  const CLIENT_COUNT = 2000;
  const clientDocs: Record<string, unknown>[] = [];

  for (let i = 0; i < CLIENT_COUNT; i++) {
    const isMale = rand() < 0.52;
    const firstName = isMale ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const lastName  = pick(LAST_NAMES);
    const cityData  = pick(CITIES);
    const street    = pick(cityData.streets);
    const houseNum  = ri(1, 120);
    const apt       = rand() < 0.6 ? `, кв. ${ri(1, 150)}` : '';
    const createdBy = pick(allUsers)._id;
    const hasEmail  = rand() < 0.42;
    const hasNotes  = rand() < 0.28;

    const noteOptions = [
      'Постійний клієнт офісу.',
      'Клієнт звертається повторно.',
      'VIP клієнт — пріоритетне обслуговування.',
      'Потребує супроводу документів на іноземній мові.',
      'Пов\'язаний з судовою справою — документи термінові.',
      'Клієнт з обмеженими можливостями — виїзд нотаріуса.',
      'Юридична особа — повний пакет документів.',
      'Спадкова справа.',
    ];

    clientDocs.push({
      firstName,
      lastName,
      nationalId: generateNationalId(usedIds),
      dateOfBirth: randomDate(eightyYearsAgo, eighteenYearsAgo),
      address: {
        street: `${street}, ${houseNum}${apt}`,
        city: cityData.city,
        postalCode: cityData.postalCode,
        country: 'Україна',
      },
      phone: `+38050${String(ri(1000000, 9999999))}`,
      email: hasEmail ? `${firstName.toLowerCase().replace(/[іїє]/g, 'i')}.${lastName.toLowerCase().replace(/[іїє]/g, 'i')}${ri(1, 99)}@${pick(EMAIL_DOMAINS)}` : undefined,
      notes: hasNotes ? pick(noteOptions) : undefined,
      createdBy,
      isActive: rand() < 0.96,
      createdAt: randomDate(threeYearsAgo, now),
    });
  }

  const insertedClients = await ClientModel.insertMany(clientDocs);
  console.log(`  ✓ ${insertedClients.length} clients`);

  // ── Services ──────────────────────────────────────────────────────────────
  console.log('Creating services …');

  const serviceTypes = Object.values(ServiceType);
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  const serviceDocs: Record<string, unknown>[] = [];
  // Map clientId → list of services (for document creation later)
  const clientServiceMap = new Map<string, { id: Types.ObjectId; type: ServiceType; status: ServiceStatus; feeAmount: number; confirmedAt?: Date; confirmedBy?: Types.ObjectId }[]>();

  for (const client of insertedClients) {
    const count = ri(1, 4);
    const clientId = client._id as Types.ObjectId;
    clientServiceMap.set(clientId.toString(), []);

    for (let j = 0; j < count; j++) {
      const type        = pick(serviceTypes);
      const { status }  = weightedPick(STATUS_WEIGHTS);
      const feeRange    = FEE_RANGES[type];
      const feeAmount   = ri(feeRange[0], feeRange[1]);
      const createdAt   = randomDate(twoYearsAgo, now);
      const createdBy   = pick(allUsers)._id as Types.ObjectId;

      let confirmedBy: Types.ObjectId | undefined;
      let confirmedAt: Date | undefined;

      if (status === ServiceStatus.COMPLETED) {
        confirmedBy = pick(notaryUsers)._id as Types.ObjectId;
        confirmedAt = randomDate(createdAt, now);
      }

      const sid = new Types.ObjectId();

      serviceDocs.push({
        _id: sid,
        client: clientId,
        type,
        status,
        description: pick(SERVICE_DESCRIPTIONS[type]),
        feeAmount,
        feeCurrency: 'UAH',
        notes: rand() < 0.2 ? 'Термінове виконання.' : undefined,
        createdBy,
        confirmedBy: confirmedBy ?? null,
        confirmedAt: confirmedAt ?? null,
        createdAt,
      });

      clientServiceMap.get(clientId.toString())!.push({
        id: sid,
        type,
        status,
        feeAmount,
        confirmedAt,
        confirmedBy,
      });
    }
  }

  await ServiceModel.insertMany(serviceDocs);
  console.log(`  ✓ ${serviceDocs.length} services`);

  // ── Documents ─────────────────────────────────────────────────────────────
  console.log('Creating documents …');

  const documentDocs: Record<string, unknown>[] = [];
  let docCounter = 1;

  for (const client of insertedClients) {
    const clientId     = (client._id as Types.ObjectId).toString();
    const services     = clientServiceMap.get(clientId) ?? [];
    const completed    = services.filter((s) => s.status === ServiceStatus.COMPLETED);

    if (completed.length === 0) continue;

    // ~65% of clients with completed services get a document
    if (rand() > 0.65) continue;

    // Group up to 2 completed services per document
    const batch = pickN(completed, rand() < 0.35 ? 2 : 1);
    const generatedAt  = randomDate(twoYearsAgo, now);
    const generatedBy  = pick(notaryUsers)._id as Types.ObjectId;
    const isFinal      = rand() < 0.62;
    const docType      = batch[0].type;
    const docTitle     = pick(DOC_TITLES[docType]);
    const docDate      = generatedAt;
    const docNumber    = generateDocNumber(docCounter++, docDate);
    const notaryUser   = notaryUsers.find((u) => (u._id as Types.ObjectId).toString() === generatedBy.toString());
    const notaryName   = notaryUser?.name ?? 'Нотаріус';

    const content = generateDocContent({
      documentNumber: docNumber,
      title: docTitle,
      notaryName,
      generatedAt: docDate,
      client: {
        firstName: client.firstName as string,
        lastName:  client.lastName  as string,
        nationalId: client.nationalId as string,
        dateOfBirth: client.dateOfBirth as Date,
        address: `${(client.address as Record<string, string>).street}, ${(client.address as Record<string, string>).postalCode} ${(client.address as Record<string, string>).city}`,
        phone: client.phone as string,
        email: client.email as string | undefined,
      },
      services: batch.map((s) => ({
        type: s.type,
        description: pick(SERVICE_DESCRIPTIONS[s.type]),
        feeAmount: s.feeAmount,
        feeCurrency: 'UAH',
        confirmedAt: s.confirmedAt,
      })),
    });

    const verStatus: VerificationStatus | null = rand() < 0.55
      ? VerificationStatus.VERIFIED
      : rand() < 0.3
        ? VerificationStatus.NOT_FOUND
        : null;

    const docEntry: Record<string, unknown> = {
      documentNumber: docNumber,
      title: docTitle,
      client: client._id,
      services: batch.map((s) => s.id),
      content,
      status: isFinal ? DocumentStatus.FINAL : DocumentStatus.DRAFT,
      verificationStatus: verStatus,
      generatedBy,
      finalizedBy: isFinal ? pick(notaryUsers)._id : null,
      finalizedAt: isFinal ? randomDate(generatedAt, now) : null,
      createdAt: generatedAt,
    };

    documentDocs.push(docEntry);
  }

  await DocumentModel.insertMany(documentDocs);
  console.log(`  ✓ ${documentDocs.length} documents`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete');
  console.log(`   Users:     ${insertedUsers.length}  (3 notaries / 17 assistants)`);
  console.log(`   Clients:   ${insertedClients.length}`);
  console.log(`   Services:  ${serviceDocs.length}`);
  console.log(`   Documents: ${documentDocs.length}`);
  console.log('\n   Login credentials (all accounts use the same password):');
  console.log('   Password: Password123!');
  console.log('\n   Notary accounts:');
  notaryNames.forEach((u) => console.log(`     ${u.email}`));
  console.log('\n   Assistant accounts (first 3):');
  assistantNames.slice(0, 3).forEach((u) => console.log(`     ${u.email}`));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
