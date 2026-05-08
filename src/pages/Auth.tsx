import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { DollarSign, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { CreateUserDto, LoginDto } from '@/api/model';
import { useSignIn } from '@/api/auth/auth';
import { useUserCreate } from '@/api/users/users';
import { Input } from '@/components/ui/input';

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: signIn } = useSignIn();
  const { mutate: createUser } = useUserCreate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginDto>({
    defaultValues: { username: '', password: '' },
  });

  const registerForm = useForm<CreateUserDto>({
    defaultValues: { email: '', password: '' },
  });

  const handleLogin = (data: LoginDto) => {
    signIn(
      { data },
      {
        onSuccess: (res) => {
          enqueueSnackbar(t('auth.messages.loginSuccess'), { variant: 'success' });
          login(res.data);
          navigate('/');
        },
        onError: () => {
          enqueueSnackbar(t('auth.messages.loginError'), { variant: 'error' });
        },
      },
    );
  };

  const handleRegister = (data: CreateUserDto) => {
    createUser(
      { data },
      {
        onSuccess: () => {
          enqueueSnackbar(t('auth.messages.registerSuccess'), { variant: 'success' });
          signIn(
            { data: { username: data.email, password: data.password } },
            {
              onSuccess: (res) => {
                login(res.data);
                navigate('/onboarding');
              },
              onError: () => {
                navigate('/auth');
              },
            },
          );
        },
        onError: () => {
          enqueueSnackbar(t('auth.messages.registerError'), { variant: 'error' });
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <DollarSign className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">FreelanceBooks</CardTitle>
            <CardDescription>{t('auth.tagline')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('auth.tabs.login')}</TabsTrigger>
              <TabsTrigger value="register">{t('auth.tabs.register')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    rules={{ required: t('validation.required', { field: t('auth.fields.username') }) }}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.fields.username')}</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="vas@email.cz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    rules={{ required: t('validation.required', { field: t('auth.fields.password') }) }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.fields.password')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    {t('auth.actions.signIn')}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    rules={{ required: t('validation.required', { field: t('auth.fields.email') }) }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.fields.email')}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="vas@email.cz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    rules={{ required: t('validation.required', { field: t('auth.fields.password') }) }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.fields.password')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              {...field}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowPassword((v) => !v)}
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    {t('auth.actions.createAccount')}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
