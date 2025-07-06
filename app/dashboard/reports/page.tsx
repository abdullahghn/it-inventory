export default function ReportsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Analytics and reporting dashboard</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Reports */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Asset Reports</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium">Asset Inventory Summary</h3>
              <p className="text-sm text-gray-500">Overview of all assets by type and status</p>
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium">Asset Utilization</h3>
              <p className="text-sm text-gray-500">Asset usage and assignment metrics</p>
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium">Maintenance Schedule</h3>
              <p className="text-sm text-gray-500">Upcoming maintenance and service dates</p>
            </button>
          </div>
        </div>

        {/* User Reports */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Reports</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium">User Asset Assignments</h3>
              <p className="text-sm text-gray-500">Assets assigned to each user</p>
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium">Department Overview</h3>
              <p className="text-sm text-gray-500">Asset distribution by department</p>
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium">User Activity</h3>
              <p className="text-sm text-gray-500">User access and activity logs</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 