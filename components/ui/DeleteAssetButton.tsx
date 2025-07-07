'use client'

import { deleteAsset } from '@/actions/assets'

interface DeleteAssetButtonProps {
  assetId: number
  assetName: string
}

export default function DeleteAssetButton({ assetId, assetName }: DeleteAssetButtonProps) {
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${assetName}"? This action cannot be undone.`)) {
      await deleteAsset(assetId)
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
    >
      Delete Asset
    </button>
  )
} 