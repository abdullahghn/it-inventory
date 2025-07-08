import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function TestStyling() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">🎨 Style Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-3">Badges:</h2>
          <div className="flex gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-3">Buttons:</h2>
          <div className="flex gap-2">
            <Button variant="default">Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </div>
        
        <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg">
          <p className="text-blue-800">
            ✅ If you see styled components above (colored badges and buttons), 
            your UI system is working correctly!
          </p>
        </div>
      </div>
    </div>
  )
} 