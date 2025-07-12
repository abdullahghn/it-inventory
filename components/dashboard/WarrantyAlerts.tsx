'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, Calendar, Package } from 'lucide-react'
import Link from 'next/link'

interface WarrantyAlert {
  id: number
  assetTag: string
  name: string
  warrantyExpiry: string
  category: string
}

interface WarrantyAlertsProps {
  expiring30Days: WarrantyAlert[]
  expiring60Days: WarrantyAlert[]
  expiring90Days: WarrantyAlert[]
  totalExpiring30Days: number
  totalExpiring60Days: number
  totalExpiring90Days: number
}

export function WarrantyAlerts({
  expiring30Days,
  expiring60Days,
  expiring90Days,
  totalExpiring30Days,
  totalExpiring60Days,
  totalExpiring90Days
}: WarrantyAlertsProps) {
  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Get alert level and styling
  const getAlertLevel = (days: number) => {
    if (days <= 30) {
      return {
        level: 'Critical',
        color: 'bg-red-50 border-red-200',
        textColor: 'text-red-800',
        badgeColor: 'bg-red-100 text-red-800',
        icon: AlertTriangle
      }
    } else if (days <= 60) {
      return {
        level: 'Warning',
        color: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-800',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      }
    } else {
      return {
        level: 'Info',
        color: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-800',
        badgeColor: 'bg-blue-100 text-blue-800',
        icon: Calendar
      }
    }
  }

  // Render asset list
  const renderAssetList = (assets: WarrantyAlert[], title: string, days: number) => {
    if (assets.length === 0) return null

    const alertLevel = getAlertLevel(days)
    const IconComponent = alertLevel.icon

    return (
      <Card className={`${alertLevel.color} border`}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 ${alertLevel.textColor}`}>
            <IconComponent className="h-5 w-5" />
            {title}
            <Badge className={alertLevel.badgeColor}>
              {assets.length} assets
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assets.slice(0, 5).map((asset) => {
              const daysUntil = getDaysUntilExpiry(asset.warrantyExpiry)
              return (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.assetTag} • {asset.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(asset.warrantyExpiry).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {daysUntil} days left
                      </p>
                    </div>
                    <Link href={`/dashboard/assets/${asset.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
            {assets.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm">
                  View all {assets.length} assets
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalAlerts = totalExpiring30Days + totalExpiring60Days + totalExpiring90Days

  if (totalAlerts === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Warranty Alerts
          </CardTitle>
          <CardDescription>
            Assets with warranty expiring in the next 90 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-700 mb-2">
              No Warranty Alerts
            </h3>
            <p className="text-muted-foreground">
              All assets have valid warranties or no warranty information available.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Warranty Alerts Summary
          </CardTitle>
          <CardDescription>
            Assets with warranty expiring in the next 90 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {totalExpiring30Days > 0 && (
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {totalExpiring30Days}
                </div>
                <div className="text-sm text-red-700 font-medium">
                  Critical (≤30 days)
                </div>
              </div>
            )}
            {totalExpiring60Days > 0 && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">
                  {totalExpiring60Days}
                </div>
                <div className="text-sm text-yellow-700 font-medium">
                  Warning (31-60 days)
                </div>
              </div>
            )}
            {totalExpiring90Days > 0 && (
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {totalExpiring90Days}
                </div>
                <div className="text-sm text-blue-700 font-medium">
                  Info (61-90 days)
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts (30 days) */}
      {renderAssetList(expiring30Days, 'Critical Alerts - Expiring in 30 Days', 30)}

      {/* Warning Alerts (60 days) */}
      {renderAssetList(expiring60Days, 'Warning Alerts - Expiring in 31-60 Days', 60)}

      {/* Info Alerts (90 days) */}
      {renderAssetList(expiring90Days, 'Info Alerts - Expiring in 61-90 Days', 90)}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" className="flex-1">
          <Calendar className="h-4 w-4 mr-2" />
          Export Warranty Report
        </Button>
        <Button variant="outline" className="flex-1">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Set Reminders
        </Button>
      </div>
    </div>
  )
} 