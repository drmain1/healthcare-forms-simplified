'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState(0)

  const featureScreenshots = [
    {
      title: 'Body Sensation Mapping',
      description: 'Interactive body diagrams for precise symptom location',
      image: '/screenshots/sensation-diagram.png'
    },
    {
      title: 'Smart Height & Weight Sliders',
      description: 'Intuitive patient vitals collection',
      image: '/screenshots/vitals-sliders.png'
    },
    {
      title: 'Review of Systems',
      description: 'Comprehensive symptom checklist organized by body system',
      image: '/screenshots/review-systems.png'
    }
  ]

  return (
    <>
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-between items-center py-4">
            <div className="text-2xl font-semibold">
              <span className="text-blue-600">EasyDoc</span>
              <span className="text-orange-500">Forms</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">Features</Link>
              <Link href="#how" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">How It Works</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">Pricing</Link>
              <Link href="#contact" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">Contact</Link>
              <Link href="#" className="bg-orange-500 text-white px-5 py-2.5 rounded hover:bg-orange-600 transition-all hover:-translate-y-0.5 hover:shadow-lg font-medium">
                Try Free for 30 Days
              </Link>
            </div>
            <button 
              className="md:hidden text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center pt-10">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Finally, Patient Forms That{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">Don't Suck</span>
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-orange-400 opacity-50"></span>
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                I'm a doctor who got tired of doing paperwork at 9 PM instead of reading bedtime stories. 
                So I built this. Upload any PDF medical form, and watch it become a smart, mobile-friendly form in seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="#" className="bg-orange-500 text-white px-6 py-3 rounded hover:bg-orange-600 transition-all hover:-translate-y-0.5 hover:shadow-lg font-medium text-center">
                  Start Free Trial - No Card Needed
                </Link>
                <Link href="#demo" className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded hover:bg-blue-600 hover:text-white transition-all font-medium text-center">
                  Watch 30-Second Demo
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xl">🔒</span>
                  <strong className="text-gray-900">HIPAA Compliant</strong>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xl">👨‍⚕️</span>
                  <strong className="text-gray-900">Built by Doctors</strong>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xl">⚡</span>
                  <strong className="text-gray-900">5-Minute Setup</strong>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-4 left-8 bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-medium z-10">
                ✨ Magic happens here
              </div>
              <div className="bg-white rounded-lg shadow-xl p-8">
                <div className="border-2 border-dashed border-gray-300 rounded-lg py-12 px-8 text-center bg-gray-50 hover:border-blue-600 hover:bg-blue-50 transition-all cursor-pointer">
                  <div className="text-5xl mb-4">📄</div>
                  <h3 className="text-xl font-semibold mb-2">Drop ANY Medical PDF Here</h3>
                  <p className="text-gray-600 mb-4">Intake forms, consent forms, assessments - anything</p>
                  <div className="text-3xl text-orange-500 my-4">⬇️</div>
                  <div className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-lg text-green-700">
                    <span>✨</span>
                    <strong>Instant Smart Form</strong>
                    <span>Ready for patients!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Screenshots Section - NEW */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-semibold mb-4 text-gray-900">
              See It In <span className="text-orange-500">Action</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Real forms, real patients, real time savings. Click to explore each feature.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {featureScreenshots.map((feature, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFeature(idx)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedFeature === idx
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {feature.title}
              </button>
            ))}
          </div>

          {/* Screenshot Display */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="order-2 lg:order-1">
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                  {featureScreenshots[selectedFeature].title}
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  {featureScreenshots[selectedFeature].description}
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-gray-700">Mobile-optimized for patient convenience</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-gray-700">Auto-saves progress to prevent data loss</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-gray-700">HIPAA-compliant data collection</span>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg p-4">
                  <div className="relative bg-white rounded-lg overflow-hidden" style={{ aspectRatio: '9/16' }}>
                    <img 
                      src={featureScreenshots[selectedFeature].image}
                      alt={featureScreenshots[selectedFeature].title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why HIPAA Compliant Forms */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-semibold mb-4 text-gray-900">
              Why HIPAA Compliant <span className="text-orange-500">Online Intake Forms?</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Streamline your intake forms online. Automate your new patient paperwork. Start saving time and money.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '📋',
                gradient: 'from-purple-400 to-purple-600',
                title: 'Intake Form Packets',
                description: 'Combine multiple pages into an online form packet. Have your patients fill out their medical history, consent to treat, and demographics all in one new patient intake form packet.'
              },
              {
                icon: '✍️',
                gradient: 'from-pink-400 to-red-500',
                title: 'HIPAA Compliant Electronic Signatures',
                description: 'Collect electronic patient signatures before the appointment. Easily give your patients the ability to digitally sign from their phone, tablet, or computer.'
              },
              {
                icon: '🔨',
                gradient: 'from-cyan-400 to-cyan-600',
                title: 'HIPAA Compliant Form Builder',
                description: 'Easily build HIPAA compliant online forms. No coding required to create secure online intake forms for your patients. All patient form submissions are encrypted in transit and rest. A Business Associate Agreement is included with your service.'
              },
              {
                icon: '📸',
                gradient: 'from-green-400 to-teal-500',
                title: 'Card Photo Uploads',
                description: 'Have your patient take a picture of their insurance and ID cards. New patients will automatically upload a photo of their card information, so you can verify it before the appointment.'
              }
            ].map((feature, idx) => (
              <div key={idx} className="text-center p-6 bg-white rounded-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-3xl text-white shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Pain Points */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-semibold mb-4 text-gray-900">
              Let's Be Honest About <span className="text-orange-500">What's Broken</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              These aren't just statistics. They're nights away from family, frustrated patients, and denied claims.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                stat: '16.6%',
                title: 'Of Every Workday Lost to Admin',
                description: "That's Thursday afternoon. Every week. Gone to paperwork instead of patients.",
                quote: "I became a doctor to help people, not to be a glorified data entry clerk."
              },
              {
                stat: '86 min',
                title: 'After-Hours "Pajama Time" Daily',
                description: "While your kids ask why you're always on the computer. While your partner eats dinner alone.",
                quote: "My daughter asked if my laptop was more important than her. That hurt."
              },
              {
                stat: '$2.1M',
                title: 'Average HIPAA Violation Fine',
                description: "One wrong email. One misplaced form. One tired mistake after a long day.",
                quote: "The compliance anxiety keeps me up at night more than patient cases."
              },
              {
                stat: '73%',
                title: 'Mobile Form Abandonment Rate',
                description: "Patients trying to pinch and zoom PDFs on phones. Showing up with blank forms. Starting appointments behind.",
                quote: "We spend the first 15 minutes of every appointment doing forms."
              }
            ].map((pain, idx) => (
              <div key={idx} className="bg-white p-8 rounded-lg border-l-4 border-orange-500 shadow-md">
                <span className="text-4xl font-bold text-orange-500 block mb-2">{pain.stat}</span>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{pain.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{pain.description}</p>
                <p className="italic text-gray-800 border-l-4 border-gray-200 pl-4">"{pain.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-semibold mb-4 text-gray-900">
              Three Steps to <span className="text-orange-500">Freedom</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Seriously, it's this simple. I made sure of it.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: '1',
                title: 'Upload Your Forms',
                description: "Any PDF, any format. Scanned, digital, doesn't matter. Our AI reads it all."
              },
              {
                number: '2',
                title: 'We Make Them Smart',
                description: 'Auto-detection of fields, mobile optimization, conditional logic - all automatic.'
              },
              {
                number: '3',
                title: 'Share & Relax',
                description: "Send a link. Patients fill it out at home. Data flows to your EHR. You go home on time."
              }
            ].map((step, idx) => (
              <div key={idx} className="text-center relative">
                <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-8 -right-12 text-4xl text-gray-300">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-semibold mb-4 text-gray-900">
              One Price. <span className="text-orange-500">Everything Included.</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              No surprises, no per-form fees, no patient limits. Just simple.
            </p>
          </div>
          
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-blue-600 text-white p-8 text-center">
              <h3 className="text-2xl font-semibold mb-2">Complete Package</h3>
              <div className="text-6xl font-bold">
                $25<span className="text-xl font-normal opacity-90">/month</span>
              </div>
              <div className="mt-4 opacity-90">Less than one patient copay</div>
            </div>
            
            <div className="p-8">
              <ul className="space-y-4">
                {[
                  { title: 'Unlimited Forms & Patients', subtitle: 'No limits, ever. Period.' },
                  { title: 'AI PDF Conversion', subtitle: 'Any form becomes smart in seconds' },
                  { title: 'True Mobile Optimization', subtitle: 'Not just responsive - actually usable' },
                  { title: 'Body Diagrams & Assessments', subtitle: 'Pain mapping, Oswestry, PHQ-9, more' },
                  { title: 'Insurance Card Scanner', subtitle: 'Photo to data in seconds' },
                  { title: 'EHR Integration', subtitle: 'Works with Epic, Cerner, any HL7' },
                  { title: 'Custom Fields Available', subtitle: '$500 one-time for any custom need' }
                ].map((feature, idx) => (
                  <li key={idx} className="flex gap-3 pb-4 border-b border-gray-200 last:border-0">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">{feature.title}</strong>
                      <br />
                      <span className="text-gray-600 text-sm">{feature.subtitle}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-8 pt-0 border-t border-gray-200">
              <Link href="#" className="block w-full bg-orange-500 text-white text-center py-4 rounded hover:bg-orange-600 transition-all text-lg font-medium">
                Start Your 30-Day Free Trial
              </Link>
              <p className="text-center mt-4 text-sm text-gray-600">
                No credit card needed • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor's Note */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-yellow-50 border-2 border-yellow-300 rounded-lg p-12">
            <div className="absolute -top-4 left-8 bg-yellow-300 px-4 py-2 rounded text-sm font-semibold">
              📝 A note from the doc who built this
            </div>
            <div className="space-y-4 text-gray-800">
              <p>
                <strong>Look, I get it.</strong> You've probably tried other form solutions. They promised the moon and delivered... more complexity.
              </p>
              <p>
                I built EasyDocForms because I was drowning. 16-hour days, paperwork until midnight, missing my kid's soccer games. The breaking point? My 6-year-old asked if I loved my computer more than her.
              </p>
              <p>
                This isn't just another tech product. It's built by someone who's filled out these forms at 11 PM, who's dealt with angry patients because forms wouldn't load on phones, who's had claims denied for ridiculous paperwork reasons.
              </p>
              <p>
                Every feature exists because I needed it. The AI form converter? Built after spending a weekend manually recreating 47 forms. Mobile optimization? After watching elderly patients struggle with pinch-to-zoom for the thousandth time.
              </p>
              <p>
                <strong>Try it for 30 days. No card required.</strong> If it doesn't save you at least 5 hours a week, I'll personally help you find something that works better.
              </p>
              <div className="mt-8 italic text-gray-600">
                - Dr. Alex (Yes, a real doctor who learned to code out of desperation)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">Ready to Go Home On Time?</h2>
          <p className="text-xl mb-8 opacity-95">Join 500+ doctors who've reclaimed their evenings</p>
          <Link href="#" className="inline-block bg-white text-blue-600 px-8 py-4 rounded hover:-translate-y-1 hover:shadow-2xl transition-all text-lg font-semibold">
            Start Free Trial Now
          </Link>
          <p className="mt-8 text-sm opacity-90">
            Setup takes 5 minutes • See results today • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-gray-900 text-white text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="opacity-80 mb-2">© 2025 EasyDocForms.com • Built with frustration, delivered with love</p>
          <p className="text-sm opacity-80 mt-4">
            HIPAA Compliant • SOC 2 Type II • 256-bit Encryption •{' '}
            <Link href="#" className="hover:underline">Privacy</Link> •{' '}
            <Link href="#" className="hover:underline">Terms</Link>
          </p>
        </div>
      </footer>
    </>
  )
}