import { BottomNav } from '@/components/BottomNav'
import { TripProvider } from '@/components/TripProvider'

export default function MainLayout({ children }: LayoutProps<'/'>) {
  return (
    <TripProvider>
      <div className="flex min-h-dvh flex-col">
        <div className="mx-auto w-full max-w-md flex-1 px-5 pt-6 pb-8">
          {children}
        </div>
        <BottomNav />
      </div>
    </TripProvider>
  )
}
