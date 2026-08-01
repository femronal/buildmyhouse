import { Text, View } from 'react-native';
import { pc } from './theme';

/**
 * Page title + persuasive value copy for /tools/price-checker.
 * The header sits above the workspace panels; the about sections sit below the
 * tool so users understand the problem it solves, why the prices can be
 * trusted, and the promise that a failed check is never wasted money.
 */

export function PriceCheckerHeader({ compact = false }: { compact?: boolean }) {
  return (
    <View style={{ marginBottom: compact ? 14 : 32, maxWidth: 720, width: '100%' }}>
      <Text
        style={{
          fontFamily: 'Poppins_600SemiBold',
          fontSize: compact ? 10 : 12,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#737373',
          marginBottom: compact ? 4 : 8,
        }}
      >
        Hiring, quotations &amp; budgeting
      </Text>
      <Text
        style={{
          fontFamily: 'Poppins_600SemiBold',
          fontSize: compact ? 22 : 30,
          lineHeight: compact ? 28 : 36,
          color: '#171717',
          marginBottom: compact ? 6 : 12,
        }}
        accessibilityRole="header"
      >
        Price Checker
      </Text>
      <Text
        style={{
          fontFamily: 'Poppins_400Regular',
          fontSize: compact ? 13 : 16,
          lineHeight: compact ? 18 : 24,
          color: '#525252',
        }}
      >
        {compact
          ? 'Search a material, answer a few questions, and get a source-backed price range with a confidence score.'
          : 'Stop guessing what building materials should cost. Search a material, answer a few quick questions, and get a price range built from real, traceable market listings — with a confidence score that tells you exactly how much to trust it.'}
      </Text>
    </View>
  );
}

function AboutCard({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <View className="mb-3 rounded-2xl border border-neutral-200 bg-white p-4 md:mb-4 md:p-6">
      <Text
        className="mb-1 text-[10px] uppercase tracking-widest text-neutral-500 md:text-[11px]"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        {label}
      </Text>
      <Text className="mb-2 text-base text-neutral-900 md:mb-3 md:text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-2 text-sm leading-relaxed text-neutral-600" style={{ fontFamily: 'Poppins_400Regular' }}>
      {children}
    </Text>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="mb-2 flex-row">
      <Text className="mr-2 text-sm" style={{ color: pc.green, fontFamily: 'Poppins_600SemiBold' }}>
        ✓
      </Text>
      <Text className="flex-1 text-sm leading-relaxed text-neutral-600" style={{ fontFamily: 'Poppins_400Regular' }}>
        {children}
      </Text>
    </View>
  );
}

export function PriceCheckerAbout({ compact = false }: { compact?: boolean }) {
  return (
    <View style={{ marginTop: compact ? 24 : 40, maxWidth: 720, width: '100%' }}>
      <AboutCard label="The problem it solves" title="Confirming a fair price in Nigeria is genuinely hard">
        <Body>
          You are quoted a price and have no honest way to know if it is fair. Contractors pad
          quotations. Sellers size you up before naming a figure — and quote higher the moment they
          sense you are not a regular buyer or you are calling from abroad. Prices move week to
          week, so last month&apos;s figure is already stale.
        </Body>
        <Body>
          Calling around the market takes days, the answers contradict each other, and one wrong
          assumption on cement, steel or roofing can quietly add hundreds of thousands of naira to
          a project. That is the problem this tool exists to end.
        </Body>
      </AboutCard>

      <AboutCard label="Why you can trust it" title="Real prices. Never invented.">
        <Bullet>
          Every price in your report is traceable to a real, current listing — with the source and
          the exact date it was checked.
        </Bullet>
        <Bullet>
          The checker never guesses or makes up a price. If the evidence is not strong enough, it
          tells you so plainly instead of showing you a comfortable-looking number.
        </Bullet>
        <Bullet>
          Duplicate sellers, outdated listings and wrong-specification products are detected and
          excluded, so one trader posting ten adverts cannot distort your range.
        </Bullet>
        <Bullet>
          Every report carries a confidence score out of 100, with plain-language reasons — how
          many independent sellers were found, how recent the prices are, and how closely they
          matched your exact specification and location.
        </Bullet>
      </AboutCard>

      <AboutCard label="Our promise" title="If the checker can't confirm it, a real person will">
        <Body>
          Some materials are simply not listed openly online — prices live in the market, in
          conversations. When that happens, your check is never wasted: you qualify for a verified
          local market check, where a real BuildMyHouse agent physically visits the market and
          confirms current prices for your exact product and location.
        </Body>
        <Body>
          It is one tap on WhatsApp from your report. You bring the question; we make sure you
          leave with a real answer — from the tool or from a person on the ground.
        </Body>
      </AboutCard>

      <Text
        className="mb-2 px-1 text-xs leading-relaxed text-neutral-500"
        style={{ fontFamily: 'Poppins_400Regular' }}
      >
        Built for homeowners, contractors, landlords and Nigerians abroad who need defensible
        material prices before money changes hands.
      </Text>
    </View>
  );
}
