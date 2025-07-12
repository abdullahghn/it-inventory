'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface AssignmentHistoryItem {
  id: number
  userId: string
  userName: string | null
  userEmail: string | null
  status: string
  assignedAt: Date
  expectedReturnAt?: Date | null
  returnedAt?: Date | null
  purpose?: string | null
  notes?: string | null
  returnNotes?: string | null
  assignedBy?: string | null
  returnedBy?: string | null
  actualReturnCondition?: string | null
}

interface AssetAssignmentHistoryProps {
  assetId: number
  assignments: AssignmentHistoryItem[]
}

export default function AssetAssignmentHistory({ assetId, assignments }: AssetAssignmentHistoryProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'returned':
        return <XCircle className="w-4 h-4 text-gray-600" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'returned':
        return 'bg-gray-100 text-gray-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const isOverdue = (assignment: AssignmentHistoryItem) => {
    if (assignment.status === 'returned') return false
    if (!assignment.expectedReturnAt) return false
    return new Date() > assignment.expectedReturnAt
  }

  const getAssignmentDuration = (assignedAt: Date, returnedAt?: Date | null) => {
    const start = new Date(assignedAt)
    const end = returnedAt ? new Date(returnedAt) : new Date()
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Assignment History
        </h2>
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No assignment history found for this asset.</p>
          <p className="text-sm">This asset has never been assigned to any user.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <User className="w-5 h-5" />
        Assignment History
        <span className="text-sm font-normal text-gray-500">
          ({assignments.length} assignment{assignments.length !== 1 ? 's' : ''})
        </span>
      </h2>
      
      <div className="space-y-4">
        {assignments.map((assignment, index) => {
          const isExpanded = expandedItems.has(assignment.id)
          const overdue = isOverdue(assignment)
          const status = overdue ? 'overdue' : assignment.status
          
          return (
            <div
              key={assignment.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {assignment.userName || 'Unknown User'}
                      </span>
                      {assignment.userEmail && (
                        <span className="text-sm text-gray-500">
                          ({assignment.userEmail})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Assigned: {format(new Date(assignment.assignedAt), 'MMM dd, yyyy')}
                      </span>
                      {assignment.expectedReturnAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expected: {format(new Date(assignment.expectedReturnAt), 'MMM dd, yyyy')}
                        </span>
                      )}
                      {assignment.returnedAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Returned: {format(new Date(assignment.returnedAt), 'MMM dd, yyyy')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Duration: {getAssignmentDuration(assignment.assignedAt, assignment.returnedAt)} days
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                    {status}
                  </span>
                  <button
                    onClick={() => toggleExpanded(assignment.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {isExpanded ? '−' : '+'}
                  </button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  {assignment.purpose && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Purpose:</span>
                      <p className="text-sm text-gray-900 mt-1">{assignment.purpose}</p>
                    </div>
                  )}
                  
                  {assignment.assignedBy && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Assigned by:</span>
                      <p className="text-sm text-gray-900 mt-1">{assignment.assignedBy}</p>
                    </div>
                  )}
                  
                  {assignment.returnedBy && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Returned by:</span>
                      <p className="text-sm text-gray-900 mt-1">{assignment.returnedBy}</p>
                    </div>
                  )}
                  
                  {assignment.actualReturnCondition && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Return condition:</span>
                      <p className="text-sm text-gray-900 mt-1 capitalize">{assignment.actualReturnCondition}</p>
                    </div>
                  )}
                  
                  {assignment.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Assignment notes:</span>
                      <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-2 rounded">{assignment.notes}</p>
                    </div>
                  )}
                  
                  {assignment.returnNotes && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Return notes:</span>
                      <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-2 rounded">{assignment.returnNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
} 