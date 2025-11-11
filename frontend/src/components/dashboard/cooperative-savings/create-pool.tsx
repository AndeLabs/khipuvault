/**
 * @fileoverview Create Cooperative Pool V3 - Production Ready
 * Modern UI for creating saving pools with native BTC deposits
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCooperativePool } from '@/hooks/web3/use-cooperative-pool'
import { useIsFetching } from '@tanstack/react-query'
import { Users, TrendingUp, Shield, Info, Loader2, CheckCircle2, Sparkles } from 'lucide-react'
import { formatEther } from 'viem'

interface CreatePoolV3Props {
  onSuccess?: () => void
}

export function CreatePoolV3({ onSuccess }: CreatePoolV3Props = {}) {
  const { createPool, state, error, txHash, isProcessing } = useCooperativePool()
  const isSyncing = useIsFetching({ queryKey: ['cooperative-pool'] }) > 0
  const [countdown, setCountdown] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    minContribution: '0.001',
    maxContribution: '1',
    maxMembers: '10',
    description: ''
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // ✅ Smart transition: Wait for sync to complete before navigating
  useEffect(() => {
    if (state === 'success' && !isSyncing && !isTransitioning) {
      console.log('🎯 Pool created successfully, starting transition countdown')
      setIsTransitioning(true)
      setCountdown(3)
    }
  }, [state, isSyncing, isTransitioning])

  // ✅ Countdown timer for smooth UX
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && isTransitioning) {
      console.log('🚀 Navigating to My Pools')
      onSuccess?.()
    }
  }, [countdown, isTransitioning, onSuccess])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido'
    } else if (formData.name.length < 3) {
      errors.name = 'Mínimo 3 caracteres'
    } else if (formData.name.length > 50) {
      errors.name = 'Máximo 50 caracteres'
    }

    const min = parseFloat(formData.minContribution)
    const max = parseFloat(formData.maxContribution)
    const members = parseInt(formData.maxMembers)

    if (isNaN(min) || min < 0.001) {
      errors.minContribution = 'Mínimo 0.001 BTC'
    }

    if (isNaN(max) || max < min) {
      errors.maxContribution = 'Debe ser mayor que el mínimo'
    }

    if (max > 100) {
      errors.maxContribution = 'Máximo 100 BTC'
    }

    if (isNaN(members) || members < 2) {
      errors.maxMembers = 'Mínimo 2 miembros'
    }

    if (members > 100) {
      errors.maxMembers = 'Máximo 100 miembros'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    await createPool(
      formData.name,
      formData.minContribution,
      formData.maxContribution,
      parseInt(formData.maxMembers)
    )
  }

  const handleReset = () => {
    setFormData({
      name: '',
      minContribution: '0.001',
      maxContribution: '1',
      maxMembers: '10',
      description: ''
    })
    setValidationErrors({})
  }

  if (state === 'success') {
    return (
      <Card className="bg-gradient-to-br from-green-500/10 via-card to-card border-2 border-green-500/50 animate-in fade-in zoom-in-95 duration-500">
        <CardContent className="p-6 text-center">
          <div className="relative">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4 animate-in zoom-in duration-700" />
            <Sparkles className="h-6 w-6 text-yellow-400 absolute top-0 left-1/2 -translate-x-8 animate-pulse" />
            <Sparkles className="h-5 w-5 text-yellow-300 absolute top-2 right-1/2 translate-x-8 animate-pulse delay-150" />
          </div>

          <h2 className="text-2xl font-bold text-green-500 mb-2">
            ¡Pool Creado Exitosamente!
          </h2>

          <p className="text-muted-foreground mb-4">
            Tu pool cooperativo ha sido creado. Los miembros ya pueden unirse.
          </p>

          {txHash && (
            <a
              href={`https://explorer.test.mezo.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm block mb-4"
            >
              Ver transacción en el explorer →
            </a>
          )}

          {/* Sync Status */}
          {isSyncing ? (
            <Alert className="bg-blue-500/10 border-blue-500/30 mb-4">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              <AlertDescription className="text-blue-200 text-sm">
                <strong>Sincronizando datos...</strong>
                <br />
                Actualizando la lista de pools desde blockchain
              </AlertDescription>
            </Alert>
          ) : countdown > 0 ? (
            <Alert className="bg-green-500/10 border-green-500/30 mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200 text-sm">
                <strong>Datos sincronizados</strong>
                <br />
                Redirigiendo a "Mis Pools" en {countdown}...
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-green-500/10 border-green-500/30 mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200 text-sm">
                ¡Listo! Tus datos están actualizados
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setCountdown(0)
                setIsTransitioning(true)
                onSuccess?.()
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                'Ver Mis Pools Ahora'
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isSyncing}
            >
              Crear Otro Pool
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-2 border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Crear Nuevo Pool Cooperativo
        </CardTitle>
        <CardDescription>
          Define las reglas y el propósito de tu grupo de ahorro colaborativo
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pool Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre del Pool <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ej: Ahorro Familiar 2025"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isProcessing}
              className={validationErrors.name ? 'border-red-500' : ''}
            />
            {validationErrors.name && (
              <p className="text-sm text-red-500">{validationErrors.name}</p>
            )}
          </div>

          {/* Contribution Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minContribution">
                Contribución Mínima (BTC) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="minContribution"
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.001"
                  value={formData.minContribution}
                  onChange={(e) => setFormData({ ...formData, minContribution: e.target.value })}
                  disabled={isProcessing}
                  className={validationErrors.minContribution ? 'border-red-500' : ''}
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">BTC</span>
              </div>
              {validationErrors.minContribution && (
                <p className="text-sm text-red-500">{validationErrors.minContribution}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxContribution">
                Contribución Máxima (BTC) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="maxContribution"
                  type="number"
                  step="0.01"
                  min="0.001"
                  placeholder="1"
                  value={formData.maxContribution}
                  onChange={(e) => setFormData({ ...formData, maxContribution: e.target.value })}
                  disabled={isProcessing}
                  className={validationErrors.maxContribution ? 'border-red-500' : ''}
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">BTC</span>
              </div>
              {validationErrors.maxContribution && (
                <p className="text-sm text-red-500">{validationErrors.maxContribution}</p>
              )}
            </div>
          </div>

          {/* Max Members */}
          <div className="space-y-2">
            <Label htmlFor="maxMembers">
              Máximo de Miembros <span className="text-red-500">*</span>
            </Label>
            <Input
              id="maxMembers"
              type="number"
              min="2"
              max="100"
              placeholder="10"
              value={formData.maxMembers}
              onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
              disabled={isProcessing}
              className={validationErrors.maxMembers ? 'border-red-500' : ''}
            />
            {validationErrors.maxMembers && (
              <p className="text-sm text-red-500">{validationErrors.maxMembers}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Número máximo de personas que pueden unirse al pool
            </p>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción <span className="text-muted-foreground">(Opcional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe el propósito del pool, reglas del grupo, objetivos de ahorro..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isProcessing}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.description.length}/500 caracteres
            </p>
          </div>

          {/* Info Banner */}
          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-200 text-sm">
              <strong className="text-blue-400">Sin costo de creación</strong>
              <br />
              Solo pagas el gas de la transacción. El pool se activa cuando el primer miembro deposita.
            </AlertDescription>
          </Alert>

          {/* Features Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <TrendingUp className="h-4 w-4 text-primary mb-1" />
              <p className="text-xs font-medium text-primary">Yields Compartidos</p>
              <p className="text-xs text-muted-foreground">5-7% APR del pool</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <Shield className="h-4 w-4 text-green-500 mb-1" />
              <p className="text-xs font-medium text-green-500">Totalmente Seguro</p>
              <p className="text-xs text-muted-foreground">Smart contracts auditados</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Users className="h-4 w-4 text-purple-500 mb-1" />
              <p className="text-xs font-medium text-purple-500">Flexible</p>
              <p className="text-xs text-muted-foreground">Entra y sal cuando quieras</p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Transaction Status */}
          {isProcessing && (
            <Alert className="bg-yellow-500/10 border-yellow-500/30 animate-pulse">
              <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
              <AlertDescription className="text-yellow-200">
                {state === 'executing' && (
                  <>
                    <strong>Paso 1 de 2:</strong> Confirma la transacción en tu wallet...
                  </>
                )}
                {state === 'processing' && (
                  <>
                    <strong>Paso 2 de 2:</strong> Creando pool en la blockchain...
                    <br />
                    <span className="text-xs">Esto puede tomar 10-30 segundos</span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isProcessing}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Crear Pool
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isProcessing}
              size="lg"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
