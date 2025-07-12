import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuthLoading } from '@/components/auth/AuthLoading'
import { Suspense } from 'react'
import { Shield, Building2, ArrowRight, Users, BarChart3 } from 'lucide-react'

// Loading component for the home page
function HomePageLoading() {
  return <AuthLoading message="Loading..." />
}

// Features component
function Features() {
  const features = [
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'Enterprise-grade security with role-based access control'
    },
    {
      icon: Building2,
      title: 'Asset Management',
      description: 'Track and manage all IT equipment efficiently'
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Manage user assignments and permissions'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Real-time insights and comprehensive reporting'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
      {features.map((feature, index) => {
        const IconComponent = feature.icon
        return (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IconComponent className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
            </div>
            <p className="text-gray-600 text-sm">{feature.description}</p>
          </div>
        )
      })}
    </div>
  )
}

export default async function HomePage() {
  const session = await auth()

  // If user is authenticated, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <Suspense fallback={<HomePageLoading />}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-8 w-8 text-blue-600" />
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">IT Inventory</h1>
              </div>
              <a
                href="/auth/signin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Comprehensive IT Asset Management
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your IT operations with our powerful asset management system. 
              Track equipment, manage assignments, and gain insights into your technology infrastructure.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/signin"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Features Section */}
          <div id="features" className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Key Features
            </h3>
            <Features />
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to get started?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of organizations using our IT inventory management system.
            </p>
            <a
              href="/auth/signin"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Sign In Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-600">
              <p>&copy; 2024 IT Inventory System. All rights reserved.</p>
              <p className="mt-2 text-sm">
                Need help? Contact{' '}
                <a href="mailto:support@company.com" className="text-blue-600 hover:text-blue-500">
                  IT Support
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Suspense>
  )
} 