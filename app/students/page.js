'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function StudentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (!session) {
      router.push('/');
      return;
    }
    const counselorId = session.user.id;

    const { data, error } = await supabase
      .from('students')
      .select('id, student_code, grade, school, is_active, profiles!students_id_fkey(full_name)')
      .eq('counselor_id', counselorId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStudents(data);
    }
    setLoading(false);
  }

  const filtered = students.filter((s) => {
    const name = s.profiles?.full_name || '';
    const code = s.student_code || '';
    return name.includes(search) || code.includes(search);
  });

  if (loading) return <div className="loading-text">در حال بارگذاری...</div>;

  return (
    <div>
      <div className="top-bar">
        <div className="brand">پنل مدیریت مشاوره</div>
        <Link href="/dashboard" className="logout-btn" style={{ textDecoration: 'none' }}>
          بازگشت به داشبورد
        </Link>
      </div>

      <div className="dashboard-wrap">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h2 style={{ color: 'var(--primary)', margin: 0 }}>دانش‌آموزان</h2>
          <Link
            href="/students/new"
            className="btn-primary"
            style={{ textDecoration: 'none', width: 'auto', padding: '10px 20px', display: 'inline-block' }}
          >
            + افزودن دانش‌آموز
          </Link>
        </div>

        <div className="field" style={{ maxWidth: 300, marginBottom: 20 }}>
          <input
            placeholder="جست‌وجوی نام یا کد دانش‌آموز..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>هنوز دانش‌آموزی اضافه نشده است.</p>
        ) : (
          <div className="stat-grid">
            {filtered.map((s) => (
              <div className="stat-card" key={s.id}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16, marginBottom: 6 }}>
                  {s.profiles?.full_name}
                </div>
                <div className="label">کد: {s.student_code || '—'}</div>
                <div className="label">پایه: {s.grade || '—'}</div>
                <div className="label">وضعیت: {s.is_active ? 'فعال' : 'غیرفعال'}</div>
                <Link
                  href={`/students/plan?id=${s.id}`}
                  style={{
                    display: 'inline-block',
                    marginTop: 10,
                    fontSize: 13,
                    color: 'var(--primary)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  برنامه‌ریزی ←
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
