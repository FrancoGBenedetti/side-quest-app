import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { registerSchema, type RegisterInput } from '../../schemas/authSchema'
import { registerWithEmail, loginWithGoogle } from '../../firebase/auth'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterInput) {
    try {
      await registerWithEmail(data.email, data.password, data.displayName)
      navigate('/')
      toast('¡Cuenta creada! Bienvenido a SideQuest', 'success')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      toast(msg.includes('email-already-in-use')
        ? 'Este email ya está registrado'
        : 'Error al crear la cuenta', 'error')
    }
  }

  async function handleGoogle() {
    try {
      await loginWithGoogle()
      navigate('/')
    } catch {
      toast('Error al registrarse con Google', 'error')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600">
            <span className="text-xl font-bold text-white">SQ</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="mt-1 text-sm text-gray-400">Únete a SideQuest</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Nombre de usuario"
              placeholder="Tu nombre"
              error={errors.displayName?.message}
              {...register('displayName')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button type="submit" loading={isSubmitting} className="w-full mt-2">
              Crear cuenta
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <hr className="flex-1 border-gray-700" />
            <span className="text-xs text-gray-500">o</span>
            <hr className="flex-1 border-gray-700" />
          </div>

          <Button variant="outline" onClick={handleGoogle} className="w-full">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </Button>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
