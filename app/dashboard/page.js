'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [studentCount, setStudentCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    checkAccessAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAccessAndLoad() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      router.push('/');
      return;
    }

    const userId = session.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'counselor') {
      router.push('/');
      return;
    }

    setFullName(profile.full_name);

    const { count: total } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('counselor_id', userId);

    const { count: active } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('counselor_id', userId)
      .eq('is_active', true);

    setStudentCount(total || 0);
    setActiveCount(active || 0);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return <div className="loading-text">در حال بارگذاری...</div>;
  }

  return (
    <div>
      <div className="top-bar">
        <div className="brand">پنل مدیریت مشاوره</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {fullName}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            خروج
          </button>
        </div>
      </div>

      <div className="dashboard-wrap">
        <h2 style={{ color: 'var(--primary)', marginBottom: 4 }}>
          خوش آمدید، {fullName}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          خلاصه‌ی وضعیت دانش‌آموزان شما
        </p>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="value">{studentCount}</div>
            <div className="label">تعداد کل دانش‌آموزان</div>
          </div>
          <div className="stat-card">
            <div className="value">{activeCount}</div>
            <div className="label">دانش‌آموزان فعال</div>
          </div>
        </div>
      </div>
    </div>
  );
}
