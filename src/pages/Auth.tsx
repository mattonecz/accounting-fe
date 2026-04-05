import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
import { DollarSign } from 'lucide-react';
import type { CreateUserDto, LoginDto } from '@/api/model';
import { useSignIn } from '@/api/auth/auth';
import { useUserCreate } from '@/api/users/users';
import { Input } from '@/components/ui/input';

export default function Auth() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: signIn } = useSignIn();
  const { mutate: createUser } = useUserCreate();
  const { login } = useAuth();

  const loginForm = useForm<LoginDto>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const registerForm = useForm<CreateUserDto>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = (data: LoginDto) => {
    signIn(
      { data },
      {
        onSuccess: (data) => {
          enqueueSnackbar('Successfully logged in!', { variant: 'success' });
          login(data.data.access_token);
          navigate('/');
        },
        onError: () => {
          enqueueSnackbar('Invalid username or password', { variant: 'error' });
        },
      },
    );
  };

  const handleRegister = (data: CreateUserDto) => {
    createUser(
      { data },
      {
        onSuccess: () => {
          enqueueSnackbar('Account created successfully!', {
            variant: 'success',
          });
          navigate('/');
        },
        onError: () => {
          enqueueSnackbar('Username already registered', { variant: 'error' });
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
            <CardDescription>
              Manage your freelance finances with ease
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    rules={{ required: 'Username is required' }}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="your@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    rules={{ required: 'Password is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Sign In
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit(handleRegister)}
                  className="space-y-4"
                >
                  <FormField
                    control={registerForm.control}
                    name="email"
                    rules={{ required: 'Email is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    rules={{ required: 'Password is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Create Account
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
