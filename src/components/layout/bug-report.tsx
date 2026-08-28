import { useState } from 'react'
import { Bug, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Static prototype, no backend to receive a report — so "file a bug" is
 * mocked entirely client-side rather than opening a real GitHub issue.
 */
export function BugReport() {
  const [open, setOpen] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [screenshot, setScreenshot] = useState<{ blob: Blob; url: string } | null>(null)
  const [description, setDescription] = useState('')

  const startReport = async () => {
    setCapturing(true)
    setScreenshot(null)
    setOpen(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(document.body, {
        backgroundColor: null,
        ignoreElements: (el) => el.hasAttribute('data-bug-report-ignore'),
      })
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      )
      if (blob) setScreenshot({ blob, url: URL.createObjectURL(blob) })
    } catch {
      toast.error("Couldn't capture a screenshot. You can still file the issue.")
    } finally {
      setCapturing(false)
    }
  }

  const fileIssue = () => {
    toast.success('Report filed. No real issue was created — this is a mocked prototype flow.')

    setOpen(false)
    setDescription('')
    if (screenshot) URL.revokeObjectURL(screenshot.url)
    setScreenshot(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next && screenshot) {
          URL.revokeObjectURL(screenshot.url)
          setScreenshot(null)
        }
      }}
    >
      <Button
        variant='ghost'
        size='icon'
        data-bug-report-ignore
        onClick={startReport}
        aria-label='Report a bug'
        title='Report a bug'
      >
        <Bug className='size-[1.125rem]' aria-hidden />
      </Button>

      <DialogContent className='sm:max-w-md' data-bug-report-ignore>
        <DialogHeader>
          <DialogTitle>Report a bug</DialogTitle>
          <DialogDescription>
            Grabs a screenshot of the current screen and files a report. This is a prototype — no real
            issue is created.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          <div className='flex aspect-video items-center justify-center overflow-hidden rounded-md border bg-muted'>
            {capturing ? (
              <Loader2 className='size-5 animate-spin text-muted-foreground' aria-hidden />
            ) : screenshot ? (
              <img
                src={screenshot.url}
                alt='Captured screenshot of the current screen'
                className='size-full object-contain'
              />
            ) : (
              <span className='text-xs text-muted-foreground'>No screenshot captured</span>
            )}
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What went wrong? What did you expect instead?"
            rows={3}
            className='w-full min-w-0 resize-none rounded-sm border-[1.35px] border-input bg-card px-3.5 py-2.5 text-sm outline-none placeholder:text-faint focus-visible:border-brand'
          />
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={fileIssue} disabled={capturing}>
            File report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
