'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastValidation } from '@/lib/action/clientHelper';
import { cn } from '@/lib/utils';
import { NextPage } from 'next';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRouter } from '@bprogress/next/app';
import InputForm from '@/components/form/InputForm';
import { useState } from 'react';
type TLoginForm = {
  email: string;
  password: string;
};
const LoginPage: NextPage = () => {
  const methods = useForm<TLoginForm>({
    mode: 'onBlur',
  });
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = methods;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false)
  const onSubmit = async (data: TLoginForm) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });
      setIsLoading(false)
      const status = response.status;
      const responseBody = await response.json();
      if (response.ok) {
        router.push('/dashboard');
        return;
      }
      toast.error(responseBody.message);
      toastValidation(responseBody.data);
    } catch (error: any) {
      setIsLoading(false)
      toast.error(error.message);
    }
  };
  return (
    <form className={'flex flex-col gap-6'} onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-4">
        <InputForm
          register={register}
          config={{
            name: 'email',
            title: 'Email',
            registerConfig: {
              required: 'cannot be empty',
            },
            type: 'email',
            placeholder: 'email@example.com',
            error: errors.email,
          }}
        />

        <div>
          <div className="grid gap-1">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="********"
              className={cn(
                errors.password
                  ? 'border-red-500/50 hover:border-red-500 focus:border-red-500'
                  : 'focus:border-primary-50 border-[#B0B4C5]/50 hover:border-blue-50',
              )}
              {...register('password', {
                required: 'Password is required',
              })}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-700">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" loading={isLoading}>
          Login
        </Button>
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{' '}
        <a href="/auth/register" className="underline underline-offset-4">
          Register
        </a>
      </div>
    </form>
  );
};

export default LoginPage;
