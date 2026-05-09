'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks'
import type { Discussion, DiscussionComment } from '@/lib/types'

export default function DiscussionDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useProfile()
  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [comments, setComments] = useState<DiscussionComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('discussions')
        .select('*, profiles(*), categories(*)')
        .eq('id', id)
        .single()
      setDiscussion(data)

      const { data: cmts } = await supabase
        .from('discussion_comments')
        .select('*, profiles(*)')
        .eq('discussion_id', id)
        .order('created_at')
      setComments(cmts || [])
      setLoading(false)
    }
    load()
  }, [id])

  async function addComment() {
    if (!newComment.trim() || !profile) return
    const { data, error } = await supabase
      .from('discussion_comments')
      .insert({ discussion_id: id, user_id: profile.id, content: newComment.trim() })
      .select('*, profiles(*)')
      .single()
    if (!error && data) {
      setComments([...comments, data])
      setNewComment('')
    }
  }

  async function deleteDiscussion() {
    if (!confirm('Delete this discussion?')) return
    await supabase.from('discussions').delete().eq('id', id)
    router.push('/discussions')
  }

  async function togglePin() {
    const newVal = !discussion?.is_pinned
    await supabase.from('discussions').update({ is_pinned: newVal }).eq('id', id)
    setDiscussion(prev => prev ? { ...prev, is_pinned: newVal } : null)
  }

  async function deleteComment(commentId: string) {
    await supabase.from('discussion_comments').delete().eq('id', commentId)
    setComments(comments.filter(c => c.id !== commentId))
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!discussion) return <div className="text-center py-12">Discussion not found</div>

  const isOwner = profile?.id === discussion.user_id
  const isAdmin = profile?.is_admin

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)] mb-2">
          {discussion.categories?.name}
        </span>
        <h1 className="text-2xl font-bold">
          {discussion.is_pinned && '📌 '}{discussion.title}
        </h1>
        <div className="flex items-center gap-3 mt-2 text-sm text-[var(--text-secondary)]">
          <span>👤 {discussion.profiles?.display_name}</span>
          <span>📅 {new Date(discussion.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap p-4 rounded-xl bg-[var(--bg-secondary)]">
        {discussion.body}
      </div>

      {(isOwner || isAdmin) && (
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={togglePin} className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg">
              {discussion.is_pinned ? 'Unpin' : 'Pin'}
            </button>
          )}
          <button onClick={deleteDiscussion} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg">Delete</button>
        </div>
      )}

      {/* Comments */}
      <div className="border-t border-[var(--border)] pt-6">
        <h2 className="text-lg font-semibold mb-4">Replies ({comments.length})</h2>

        <div className="space-y-3 mb-4">
          {comments.map(c => (
            <div key={c.id} className="p-3 rounded-lg bg-[var(--bg-secondary)]">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-sm">{c.profiles?.display_name}</span>
                  <span className="text-xs text-[var(--text-secondary)] ml-2">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                {(profile?.id === c.user_id || isAdmin) && (
                  <button onClick={() => deleteComment(c.id)} className="text-xs text-red-500 hover:underline">delete</button>
                )}
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">No replies yet. Be the first!</p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addComment())}
            placeholder="Write a reply..."
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <button onClick={addComment} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm">Reply</button>
        </div>
      </div>
    </div>
  )
}
