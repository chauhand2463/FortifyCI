'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useRegisterImage } from '@/hooks/use-queries'
import { toast } from 'sonner'
import { Container, Lock, KeyRound, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface RegisterImageModalProps {
  open: boolean
  onClose: () => void
}

export function RegisterImageModal({ open, onClose }: RegisterImageModalProps) {
  const [name, setName] = useState('')
  const [tag, setTag] = useState('latest')
  const [registry, setRegistry] = useState('docker.io')
  const [repository, setRepository] = useState('')
  const [showCredentials, setShowCredentials] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [serverAddress, setServerAddress] = useState('')
  const registerImage = useRegisterImage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !repository) {
      toast.error('Image name and repository are required')
      return
    }
    try {
      const credentials = showCredentials && username && password
        ? { username, password, serverAddress: serverAddress || undefined }
        : undefined
      await registerImage.mutateAsync({ name, tag, registry, repository, registryCredentials: credentials })
      toast.success(`Image ${name}:${tag} registered`)
      setName('')
      setTag('latest')
      setRepository('')
      setUsername('')
      setPassword('')
      setServerAddress('')
      setShowCredentials(false)
      onClose()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to register image')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Register Container Image">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#9098B8] mb-1.5">Image Name</label>
          <div className="relative">
            <Container className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-9 rounded-lg border border-[#1C2150] bg-[#080A14] pl-9 pr-3 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all"
              placeholder="e.g. nginx, alpine, node"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#9098B8] mb-1.5">Tag</label>
            <input
              type="text"
              value={tag}
              onChange={e => setTag(e.target.value)}
              className="w-full h-9 rounded-lg border border-[#1C2150] bg-[#080A14] px-3 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all"
              placeholder="latest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#9098B8] mb-1.5">Registry</label>
            <input
              type="text"
              value={registry}
              onChange={e => setRegistry(e.target.value)}
              className="w-full h-9 rounded-lg border border-[#1C2150] bg-[#080A14] px-3 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all"
              placeholder="docker.io"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#9098B8] mb-1.5">Repository</label>
          <input
            type="text"
            value={repository}
            onChange={e => setRepository(e.target.value)}
            className="w-full h-9 rounded-lg border border-[#1C2150] bg-[#080A14] px-3 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all"
            placeholder="e.g. library/nginx, myuser/app"
            required
          />
        </div>

        <button
          type="button"
          onClick={() => setShowCredentials(!showCredentials)}
          className="flex items-center gap-2 text-xs text-[#4DA6FF] hover:text-[#00D4AA] transition-colors"
        >
          <Lock className="h-3.5 w-3.5" />
          {showCredentials ? 'Hide' : 'Add'} registry credentials
          {showCredentials ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showCredentials && (
          <div className="space-y-3 pl-2 border-l-2 border-[#1C2150]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#9098B8] mb-1.5">Username</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#1C2150] bg-[#080A14] pl-9 pr-3 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all"
                    placeholder="registry username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9098B8] mb-1.5">Password / Token</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#1C2150] bg-[#080A14] pl-9 pr-3 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all"
                    placeholder="password or token"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9098B8] mb-1.5">
                Server Address <span className="text-[#5A6380]">(optional)</span>
              </label>
              <input
                type="text"
                value={serverAddress}
                onChange={e => setServerAddress(e.target.value)}
                className="w-full h-9 rounded-lg border border-[#1C2150] bg-[#080A14] px-3 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all"
                placeholder="https://index.docker.io/v1/"
              />
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-[#4DA6FF]/10 border border-[#4DA6FF]/20 px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#4DA6FF]" />
          <p className="text-xs text-[#9098B8]">
            The image will be pulled from the specified registry and scanned. Credentials are encrypted at rest and used only during scanning.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={registerImage.isPending}>
            {registerImage.isPending ? 'Registering...' : 'Register Image'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
