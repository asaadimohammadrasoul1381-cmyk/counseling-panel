'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function NewStudentPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: '',
    studentCode: '',
    grade: '',
    school: '',
    phone: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAccess() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      router.push('/');
      return;
    }
    setChecking(false);
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    const functionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/create-student';

    try {
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.error || 'خطایی رخ داد.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg('دانش‌آموز با موفقیت اضافه شد.');
      setSubmitting(false);
      setTimeout(() => router.push('/students'), 1200);
    } catch (err) {
      setErrorMsg('ارتباط با سرور برقرار نشد.');
      setSubmitting(false);
    }
  }

  if (checking) return <div className="loading-text">در حال بررسی دسترسی...</div>;

  return (
    <div className="centered-screen">
      <div className="card" style={{ maxWidth: 460 }}>
        <h1>افزودن دانش‌آموز جدید</h1>
        <p className="subtitle">اطلاعات دانش‌آموز را وارد کنید</p>

        {errorMsg && <div className="error-box">{errorMsg}</div>}
        {successMsg && (
          <div
            className="error-box"
            style={{ background: '#eafaf0', color: 'var(--success)', borderColor: '#bfe8cf' }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>نام و نام خانوادگی</label>
            <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} required />
          </div>
          <div className="field">
            <label>نام کاربری (برای ورود دانش‌آموز)</label>
            <input
              value={form.username}
              onChange={(e) => updateField('username', e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div className="field">
            <label>رمز عبور</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div className="field">
            <label>کد دانش‌آموز (اختیاری)</label>
            <input value={form.studentCode} onChange={(e) => updateField('studentCode', e.target.value)} />
          </div>
          <div className="field">
            <label>پایه تحصیلی (اختیاری)</label>
            <input value={form.grade} onChange={(e) => updateField('grade', e.target.value)} />
          </div>
          <div className="field">
            <label>مدرسه (اختیاری)</label>
            <input value={form.school} onChange={(e) => updateField('school', e.target.value)} />
          </div>
          <div className="field">
            <label>شماره تماس (اختیاری)</label>
            <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} dir="ltr" />
          </div>
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'در حال ثبت...' : 'ثبت دانش‌آموز'}
          </button>
        </form>
      </div>
    </div>
  );
}
