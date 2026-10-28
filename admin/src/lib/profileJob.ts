// Waits for a profile-fetch job (PRD §5.6): the worker runs Apify, the admin app polls its state.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, get } from './api';
import type { ProfileDraft, ProfileJob } from './types';

const POLL_MS = 2000;
const TIMEOUT_MS = 4 * 60 * 1000;

const JOB_ERRORS: Record<string, string> = {
  profile_not_found: 'پیجی با این شناسه در اینستاگرام پیدا نشد (یا خصوصی است).',
  invalid_handle: 'شناسهٔ اینستاگرام معتبر نیست.',
  apify_budget: 'بودجهٔ ماهانهٔ Apify تمام شده است؛ تصویر را دستی بارگذاری کنید.',
};

export function profileJobError(reason: string) {
  const key = Object.keys(JOB_ERRORS).find((k) => reason.startsWith(k));
  return key ? JOB_ERRORS[key] : 'خواندن پروفایل انجام نشد. دوباره تلاش کنید یا اطلاعات را دستی وارد کنید.';
}

export function useProfileJob() {
  const [running, setRunning] = useState(false);
  const cancelled = useRef(false);
  useEffect(
    () => () => {
      cancelled.current = true;
    },
    [],
  );

  /** Polls until the job finishes. Resolves with the draft; rejects with a Persian message. */
  const wait = useCallback(async (jobId: string): Promise<ProfileDraft> => {
    setRunning(true);
    const started = Date.now();
    try {
      for (;;) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (cancelled.current) throw new Error('cancelled');
        let job: ProfileJob;
        try {
          job = await get<ProfileJob>(`/shops/profile-jobs/${encodeURIComponent(jobId)}`);
        } catch (err) {
          if (err instanceof ApiError && err.status === 0) continue; // a network blip; keep waiting
          throw err;
        }
        if (job.state === 'completed') return job.result;
        if (job.state === 'failed') throw new Error(profileJobError(job.error));
        if (Date.now() - started > TIMEOUT_MS) throw new Error('خواندن پروفایل بیش از حد طول کشید. وضعیت را در صفحهٔ «کارها» ببینید.');
      }
    } finally {
      if (!cancelled.current) setRunning(false);
    }
  }, []);

  return { running, wait, setRunning };
}
