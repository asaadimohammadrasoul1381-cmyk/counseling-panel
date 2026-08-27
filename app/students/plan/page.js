'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

const WEEKDAY_NAMES = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
const SLOT_COUNT = 7;

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
    activityDate: '',
    slotNumber: '1',
    durationMinutes: '',
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
      activity_date: form.activityDate,
      slot_number: parseInt(form.slotNumber, 10),
      duration_minutes: form.durationMinutes ? parseInt(form.durationMinutes, 10) : null,
      status: 'not_done',
      priority: 'normal',
    });

    if (error) {
      setErrorMsg('خطا در ثبت فعالیت: ' + error.message);
      setSubmitting(false);
      return;
    }

    setForm((prev) => ({ ...prev, title: '', durationMinutes: '' }));
    await loadActivities();
    setSubmitting(false);
  }

  function weekdayName(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return WEEKDAY_NAMES[d.getDay()];
  }

  const uniqueDates = [...new Set(activities.map((a) => a.activity_date))].sort();
  const maxSlot = Math.max(SLOT_COUNT, ...activities.map((a) => a.slot_number || 0));
  const slotColumns = Array.from({ length: maxSlot }, (_, i) => i + 1);

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
              <h1 style={{ fontSize: 16 }}>افزودن یک خانه به برنامه</h1>
              <p className="subtitle">هر بار یک درس در یک خانه از یک روز مشخص ثبت کنید</p>
              {errorMsg && <div className="error-box">{errorMsg}</div>}
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>نام درس / فعالیت</label>
                  <input value={form.title} onChange={(e) => updateField('title', e.target.value)} required />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label>تاریخ (روز)</label>
                    <input
                      type="date"
                      value={form.activityDate}
                      onChange={(e) => updateField('activityDate', e.target.value)}
                      required
                      dir="ltr"
                    />
                  </div>
                  <div className="field" style={{ width: 110 }}>
                    <label>شماره خانه</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={form.slotNumber}
                      onChange={(e) => updateField('slotNumber', e.target.value)}
                      required
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="field">
                  <label>مدت زمان (دقیقه)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.durationMinutes}
                    onChange={(e) => updateField('durationMinutes', e.target.value)}
                    dir="ltr"
                  />
                </div>
                <button className="btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'در حال ثبت...' : 'افزودن به برنامه'}
                </button>
              </form>
            </div>

            <h2 style={{ color: 'var(--primary)', fontSize: 17, marginBottom: 12 }}>
              جدول برنامه
            </h2>

            {uniqueDates.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>هنوز خانه‌ای ثبت نشده است.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    borderCollapse: 'collapse',
                    width: '100%',
                    minWidth: 700,
                    background: 'var(--card-bg)',
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          background: 'var(--primary)',
                          color: 'white',
                          padding: '10px 8px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        روز
                      </th>
                      {slotColumns.map((slot) => (
                        <th
                          key={slot}
                          style={{
                            background: '#3d6a9e',
                            color: 'white',
                            padding: '10px 8px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          خانه {slot}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueDates.map((date) => (
                      <tr key={date}>
                        <td
                          style={{
                            background: 'var(--primary)',
                            color: 'white',
                            padding: '10px 8px',
                            border: '1px solid var(--border)',
                            fontWeight: 700,
                            textAlign: 'center',
                          }}
                        >
                          {weekdayName(date)}
                          <div style={{ fontSize: 11, fontWeight: 400 }}>{date}</div>
                        </td>
                        {slotColumns.map((slot) => {
                          const cell = activities.find(
                            (a) => a.activity_date === date && a.slot_number === slot
                          );
                          return (
                            <td
                              key={slot}
                              style={{
                                padding: '8px',
                                border: '1px solid var(--border)',
                                textAlign: 'center',
                              }}
                            >
                              {cell ? (
                                <>
                                  <div>{cell.title}</div>
                                  {cell.duration_minutes && (
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                      {cell.duration_minutes}
                                    </div>
                                  )}
                                </>
                              ) : (
                                ''
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
