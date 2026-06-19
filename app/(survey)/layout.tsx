import { ThemeProvider } from "@/components/theme-provider";

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light">
      {children}
    </ThemeProvider>
  );
}
