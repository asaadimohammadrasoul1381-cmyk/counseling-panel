'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

function PlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [activities, setActivities] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    subject: '',
    activityDate: '',
    startTime: '',
    endTime: '',
    description: '',
    priority: 'normal',
  });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      router.push('/');
      return;
    }

    if (!studentId) {
      setErrorMsg('دانش‌آموزی انتخاب نشده است.');
      setLoading(false);
      return;
    }

    const { data: studentRow, error: studentError } = await supabase
      .from('students')
      .select('id, profiles!students_id_fkey(full_name)')
      .eq('id', studentId)
      .single();

    if (studentError || !studentRow) {
      setErrorMsg('دسترسی به این دانش‌آموز ممکن نیست.');
      setLoading(false);
      return;
    }

    setStudentName(studentRow.profiles?.full_name || '');

    await loadActivities();
    setLoading(false);
  }

  async function loadActivities() {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('student_id', studentId)
      .order('activity_date', { ascending: true });

    if (!error && data) {
      setActivities(data);
    }
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const { error } = await supabase.from('activities').insert({
      student_id: studentId,
      title: form.title,
      subject: form.subject || null,
      activity_date: form.activityDate,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      description: form.description || null,
      priority: form.priority,
      status: 'not_done',
    });

    if (error) {
      setErrorMsg('خطا در ثبت فعالیت: ' + error.message);
      setSubmitting(false);
      return;
    }

    setForm({
      title: '',
      subject: '',
      activityDate: '',
      startTime: '',
      endTime: '',
      description: '',
      priority: 'normal',
    });

    await loadActivities();
    setSubmitting(false);
  }

  const statusLabels = {
    not_done: 'انجام نشده',
    in_progress: 'در حال انجام',
    done: 'انجام شده',
    incomplete: 'ناقص',
  };

  if (loading) return <div className="loading-text">در حال بارگذاری...</div>;

  return (
    <div>
      <div className="top-bar">
        <div className="brand">پنل مدیریت مشاوره</div>
        <Link href="/students" className="logout-btn" style={{ textDecoration: 'none' }}>
          بازگشت به دانش‌آموزان
        </Link>
      </div>

      <div className="dashboard-wrap">
        {errorMsg && !studentName ? (
          <div className="error-box">{errorMsg}</div>
        ) : (
          <>
            <h2 style={{ color: 'var(--primary)', marginBottom: 20 }}>
              برنامه‌ریزی برای {studentName}
            </h2>

            <div className="card" style={{ maxWidth: 500, marginBottom: 32 }}>
              <h1 style={{ fontSize: 16 }}>افزودن فعالیت جدید</h1>
              {errorMsg && <div className="error-box">{errorMsg}</div>}
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>عنوان فعالیت</label>
                  <input value={form.title} onChange={(e) => updateField('title', e.target.value)} required />
                </div>
                <div className="field">
                  <label>درس یا حوزه (اختیاری)</label>
                  <input value={form.subject} onChange={(e) => updateField('subject', e.target.value)} />
                </div>
                <div className="field">
                  <label>تاریخ</label>
                  <input
                    type="date"
                    value={form.activityDate}
                    onChange={(e) => updateField('activityDate', e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label>ساعت شروع</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => updateField('startTime', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>ساعت پایان</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => updateField('endTime', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="field">
                  <label>اولویت</label>
                  <select
                    value={form.priority}
                    onChange={(e) => updateField('priority', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      fontFamily: 'inherit',
                      fontSize: 14,
                      background: '#fbfcfe',
                    }}
                  >
                    <option value="low">کم</option>
                    <option value="normal">متوسط</option>
                    <option value="high">بالا</option>
                  </select>
                </div>
                <div className="field">
                  <label>توضیحات (اختیاری)</label>
                  <input value={form.description} onChange={(e) => updateField('description', e.target.value)} />
                </div>
                <button className="btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'در حال ثبت...' : 'افزودن فعالیت'}
                </button>
              </form>
            </div>

            <h2 style={{ color: 'var(--primary)', fontSize: 17, marginBottom: 12 }}>
              فعالیت‌های ثبت‌شده
            </h2>

            {activities.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>هنوز فعالیتی ثبت نشده است.</p>
            ) : (
              <div className="stat-grid">
                {activities.map((a) => (
                  <div className="stat-card" key={a.id}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
                      {a.title}
                    </div>
                    <div className="label">تاریخ: {a.activity_date}</div>
                    {a.subject && <div className="label">درس: {a.subject}</div>}
                    {a.start_time && (
                      <div className="label">
                        ساعت: {a.start_time?.slice(0, 5)} تا {a.end_time?.slice(0, 5) || '—'}
                      </div>
                    )}
                    <div className="label">وضعیت: {statusLabels[a.status] || a.status}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="loading-text">در حال بارگذاری...</div>}>
      <PlanContent />
    </Suspense>
  );
}
