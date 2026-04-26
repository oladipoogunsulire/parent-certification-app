import { buildContentHealthReport } from "@/lib/content-health"
import ContentHealthDashboard from "./ContentHealthDashboard"

export const metadata = {
  title: "Content Health — Admin Console",
}

export default async function AdminContentPage() {
  const report = await buildContentHealthReport()

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#1E3A5F]">Content Health</h2>
        <p className="text-sm text-gray-500 mt-1">
          Quality checks across all modules, lessons, and scenarios. Fix critical issues before launch.
        </p>
      </div>
      <ContentHealthDashboard report={report} />
    </div>
  )
}
