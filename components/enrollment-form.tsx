'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useApp } from '@/components/app-provider'
import { CameraCapture } from '@/components/camera-capture'
import { SignaturePad, SignaturePadRef } from '@/components/signature-pad'
import { Student, generateId, saveStudent } from '@/lib/database'
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EnrollmentFormProps {
  onComplete: (student: Student) => void
  onCancel: () => void
}

type Step = 'personal' | 'emergency' | 'medical' | 'photo' | 'membership' | 'waiver'

export function EnrollmentForm({ onComplete, onCancel }: EnrollmentFormProps) {
  const { t } = useApp()
  const signatureRef = useRef<SignaturePadRef>(null)
  const [currentStep, setCurrentStep] = useState<Step>('personal')
  const [error, setError] = useState<string>('')
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    allergies: '',
    medicalConditions: '',
    medications: '',
    photo: '',
    membershipType: 'monthly' as Student['membershipType'],
    beltRank: 'white' as Student['beltRank'],
    stripes: 0,
    guardianName: '',
    guardianRelationship: '',
    guardianPhone: '',
    waiverSignature: '',
    waiverAgreed: false,
  })

  const steps: Step[] = ['personal', 'emergency', 'medical', 'photo', 'membership', 'waiver']
  const currentStepIndex = steps.indexOf(currentStep)

  const isMinor = () => {
    if (!formData.dateOfBirth) return false
    const dob = new Date(formData.dateOfBirth)
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    return age < 18
  }

  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 'personal':
        if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.email || !formData.phone) {
          setError('Please fill in all required fields')
          return false
        }
        break
      case 'emergency':
        if (!formData.emergencyName || !formData.emergencyPhone || !formData.emergencyRelationship) {
          setError('Please fill in all emergency contact fields')
          return false
        }
        break
      case 'photo':
        if (!formData.photo) {
          setError(t.photoRequired)
          return false
        }
        break
      case 'waiver':
        if (isMinor() && (!formData.guardianName || !formData.guardianPhone)) {
          setError('Guardian information is required for minors')
          return false
        }
        if (!formData.waiverSignature) {
          setError(t.pleaseSignWaiver)
          return false
        }
        if (!formData.waiverAgreed) {
          setError(t.pleaseAgreeTerms)
          return false
        }
        break
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex])
      setError('')
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex])
      setError('')
    }
  }

  const handleSubmit = () => {
    if (!validateStep()) return

    const student: Student = {
      id: generateId(),
      ...formData,
      startDate: new Date().toISOString().split('T')[0],
      waiverSignedAt: new Date().toISOString(),
      totalClasses: 0,
      attendanceHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    saveStudent(student)
    onComplete(student)
  }

  const stepTitles: Record<Step, string> = {
    personal: t.personalInfo,
    emergency: t.emergencyContact,
    medical: t.medicalInfo,
    photo: t.studentPhoto,
    membership: t.membershipType,
    waiver: t.waiverTitle,
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStepIndex
                    ? 'bg-green-500 text-white'
                    : index === currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {index < currentStepIndex ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-secondary'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {stepTitles[currentStep]}
        </p>
      </div>

      <Card className="relative overflow-hidden">
        {/* FJU Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <img src="/images/fju-badge.jpg" alt="" className="w-64" />
        </div>

        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img src="/images/fju-logo.png" alt="FJU" className="h-8" />
            {t.newEnrollment}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Personal Info Step */}
          {currentStep === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.firstName} *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t.lastName} *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>{t.dateOfBirth} *</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                />
              </div>
              <div>
                <Label>{t.email} *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
              <div>
                <Label>{t.phone} *</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
              <div>
                <Label>{t.address}</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.city}</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t.state}</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.zipCode}</Label>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) => updateField('zipCode', e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t.country}</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact Step */}
          {currentStep === 'emergency' && (
            <div className="space-y-4">
              <div>
                <Label>{t.emergencyName} *</Label>
                <Input
                  value={formData.emergencyName}
                  onChange={(e) => updateField('emergencyName', e.target.value)}
                />
              </div>
              <div>
                <Label>{t.emergencyPhone} *</Label>
                <Input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => updateField('emergencyPhone', e.target.value)}
                />
              </div>
              <div>
                <Label>{t.relationship} *</Label>
                <Input
                  value={formData.emergencyRelationship}
                  onChange={(e) => updateField('emergencyRelationship', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Medical Info Step */}
          {currentStep === 'medical' && (
            <div className="space-y-4">
              <div>
                <Label>{t.allergies}</Label>
                <Textarea
                  value={formData.allergies}
                  onChange={(e) => updateField('allergies', e.target.value)}
                  placeholder="List any allergies..."
                />
              </div>
              <div>
                <Label>{t.medicalConditions}</Label>
                <Textarea
                  value={formData.medicalConditions}
                  onChange={(e) => updateField('medicalConditions', e.target.value)}
                  placeholder="List any medical conditions..."
                />
              </div>
              <div>
                <Label>{t.medications}</Label>
                <Textarea
                  value={formData.medications}
                  onChange={(e) => updateField('medications', e.target.value)}
                  placeholder="List any current medications..."
                />
              </div>
            </div>
          )}

          {/* Photo Step */}
          {currentStep === 'photo' && (
            <div className="space-y-4">
              <Label>{t.studentPhoto} *</Label>
              <CameraCapture
                onCapture={(photo) => updateField('photo', photo)}
                currentPhoto={formData.photo}
              />
            </div>
          )}

          {/* Membership Step */}
          {currentStep === 'membership' && (
            <div className="space-y-4">
              <div>
                <Label>{t.membershipType}</Label>
                <Select
                  value={formData.membershipType}
                  onValueChange={(value) => updateField('membershipType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">{t.trial}</SelectItem>
                    <SelectItem value="monthly">{t.monthly}</SelectItem>
                    <SelectItem value="quarterly">{t.quarterly}</SelectItem>
                    <SelectItem value="annual">{t.annual}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t.beltRank}</Label>
                <Select
                  value={formData.beltRank}
                  onValueChange={(value) => updateField('beltRank', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="white">{t.white}</SelectItem>
                    <SelectItem value="blue">{t.blue}</SelectItem>
                    <SelectItem value="purple">{t.purple}</SelectItem>
                    <SelectItem value="brown">{t.brown}</SelectItem>
                    <SelectItem value="black">{t.black}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t.stripes}</Label>
                <Select
                  value={formData.stripes.toString()}
                  onValueChange={(value) => updateField('stripes', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {t.stripes}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Waiver Step */}
          {currentStep === 'waiver' && (
            <div className="space-y-6">
              {/* Guardian Info for Minors */}
              {isMinor() && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <h4 className="font-semibold mb-4 text-yellow-600">{t.guardianInfo}</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>{t.guardianName} *</Label>
                      <Input
                        value={formData.guardianName}
                        onChange={(e) => updateField('guardianName', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t.guardianRelationship}</Label>
                        <Input
                          value={formData.guardianRelationship}
                          onChange={(e) => updateField('guardianRelationship', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>{t.guardianPhone} *</Label>
                        <Input
                          type="tel"
                          value={formData.guardianPhone}
                          onChange={(e) => updateField('guardianPhone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Waiver Text */}
              <div>
                <h4 className="font-semibold mb-2">{t.waiverSubtitle}</h4>
                <div className="h-48 overflow-y-auto p-4 bg-secondary rounded-lg text-sm whitespace-pre-wrap">
                  {t.waiverText}
                </div>
              </div>

              {/* Signature */}
              <div>
                <Label>{t.signatureRequired}</Label>
                <div className="mt-2">
                  <SignaturePad
                    ref={signatureRef}
                    onSignature={(sig) => updateField('waiverSignature', sig)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      signatureRef.current?.clear()
                      updateField('waiverSignature', '')
                    }}
                  >
                    {t.clearSignature}
                  </Button>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agree"
                  checked={formData.waiverAgreed}
                  onCheckedChange={(checked) => updateField('waiverAgreed', checked)}
                />
                <Label htmlFor="agree" className="text-sm cursor-pointer">
                  {t.iAgree}
                </Label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-4 border-t">
            <Button
              variant="outline"
              onClick={currentStepIndex === 0 ? onCancel : handleBack}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {currentStepIndex === 0 ? t.cancel : 'Back'}
            </Button>
            {currentStepIndex === steps.length - 1 ? (
              <Button onClick={handleSubmit} className="bg-primary">
                {t.submitEnrollment}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNext} className="bg-primary">
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
