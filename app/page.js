'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('ایمیل یا رمز عبور اشتباه است.');
      setLoading(false);
      return;
    }

    const userId = data.user.id;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    setLoading(false);

    if (profileError || !profile) {
      setErrorMsg('حساب شما پیدا شد ولی پروفایلی برایش ثبت نشده است.');
      return;
    }

    if (profile.role === 'counselor') {
      router.push('/dashboard');
    } else {
      router.push('/student');
    }
  }

  return (
    <div className="centered-screen">
      <div className="card">
        <h1>ورود به پنل مشاوره</h1>
        <p className="subtitle">لطفاً ایمیل و رمز عبور خود را وارد کنید</p>

        {errorMsg && <div className="error-box">{errorMsg}</div>}

        <form onSubmit={handleLogin}>
          <div className="field">
            <label>ایمیل</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div className="field">
            <label>رمز عبور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>
      </div>
    </div>
  );
}
