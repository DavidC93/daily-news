import { Edition } from "@/lib/types";
import { NavContext } from "@/lib/nav";
import Header from "./Header";
import Footer from "./Footer";
import DailyBrief from "./DailyBrief";
import LeadStory from "./LeadStory";
import SectionBlock from "./SectionBlock";

export default function EditionView({ edition, nav }: { edition: Edition; nav: NavContext }) {
  const leadArticle = edition.sections
    .flatMap((s) => s.items)
    .find((a) => a.id === edition.leadStoryId);

  return (
    <>
      <Header
        currentDate={nav.currentDate}
        latestDate={nav.latestDate}
        yesterdayDate={nav.yesterdayDate}
        dayBeforeDate={nav.dayBeforeDate}
      />
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 sm:px-8 py-8">
        <DailyBrief text={edition.dailySummary} />
        {leadArticle && <LeadStory article={leadArticle} date={edition.date} />}
        {edition.sections.map((section) => (
          <SectionBlock
            key={section.category}
            section={{
              ...section,
              items: section.items.filter((a) => a.id !== edition.leadStoryId),
            }}
            date={edition.date}
          />
        ))}
      </main>
      <Footer />
    </>
  );
}
