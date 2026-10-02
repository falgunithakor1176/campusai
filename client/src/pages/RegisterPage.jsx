/**
 * RegisterPage Page
 *
 * Polished user registration form using Zustand and React Router v6.
 *
 * @module pages/RegisterPage
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../store/uiStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import api from '../services/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [collegeSlug, setCollegeSlug] = useState('spectalk-demo');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        collegeSlug,
      });
      if (res.data?.success) {
        setAuth({
          user: res.data.data.user,
          accessToken: res.data.data.accessToken,
        });
        toast.success('Registration successful. Welcome to SpecTalk!');
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6 select-none">
      <Card className="max-w-md w-full p-8 space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-heading font-black text-neutral-900 text-sm">
              C
            </div>
            <span className="font-heading font-bold text-white text-md">SpecTalk</span>
          </Link>
          <h2 className="font-heading text-2xl font-bold text-neutral-100">Create Account</h2>
          <p className="text-neutral-400 text-xs">Join as a student to start asking questions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-300 font-semibold" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Rohan Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full text-sm"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-neutral-300 font-semibold" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name.surname@student.spectalk.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full text-sm"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-neutral-300 font-semibold" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full text-sm"
              disabled={loading}
              required
            />
            <p className="text-[10px] text-neutral-500 leading-normal">
              Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-neutral-300 font-semibold" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field w-full text-sm"
              disabled={loading}
              required
            />
          </div>

          <Button type="submit" loading={loading} fullWidth className="mt-2">
            Register
          </Button>
        </form>

        <div className="text-center text-xs text-neutral-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
export { RegisterPage };
