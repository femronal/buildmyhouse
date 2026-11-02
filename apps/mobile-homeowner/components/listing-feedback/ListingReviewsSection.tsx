import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import {
  listingPublicPath,
  listingReviewStatusLabel,
  listingReviewSummaryLine,
  type ListingKind,
} from '@/lib/listing-feedback';
import { requireAuthToContinue } from '@/lib/require-auth-to-continue';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyListingReview, usePublicListingReviews } from './usePublicListingReviews';

const COMMUNITY_LINE = 'Community reviews come from signed-in BMH users and are checked by BMH before they appear. They are not tied to a BMH job.';

export default function ListingReviewsSection({ kind, slug }: { kind: ListingKind; slug: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const reviews = usePublicListingReviews(kind, slug, page);
  const mine = useMyListingReview(kind, slug, !!currentUser);
  const path = listingPublicPath(kind, slug);
  const summary = reviews.data?.summary;
  const rows = reviews.data?.reviews || [];

  const save = useMutation({
    mutationFn: () =>
      api.post(`/listing-feedback/${kind}/${encodeURIComponent(slug)}/reviews`, {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      }),
    onSuccess: async () => {
      setNote('Thanks. BMH checks every review before it appears.');
      setError('');
      setOpen(false);
      await client.invalidateQueries({ queryKey: ['my-listing-review', kind, slug] });
      await client.invalidateQueries({ queryKey: ['listing-reviews', kind, slug] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const openForm = async () => {
    const allowed = await requireAuthToContinue({
      router,
      currentUser,
      userLoading,
      destinationPath: path,
      promptTitle: 'Sign in to review',
      promptMessage: 'Sign in to write a review. BMH checks it before it appears.',
    });
    if (!allowed) return;
    if (mine.data) {
      setRating(mine.data.rating);
      setTitle(mine.data.title || '');
      setComment(mine.data.comment);
    }
    setOpen(true);
    setNote('');
    setError('');
  };

  return (
    <View style={{ marginTop: 28, paddingTop: 8 }}>
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 22, color: LANDING_INK }}>Reviews</Text>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: LANDING_INK, marginTop: 8 }}>
        {reviews.isLoading ? 'Loading reviews...' : reviews.isError ? 'Reviews could not be loaded.' : listingReviewSummaryLine(summary)}
      </Text>
      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: LANDING_MUTED, lineHeight: 21, marginTop: 8 }}>{COMMUNITY_LINE}</Text>

      {mine.data ? (
        <View style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 12, padding: 12, marginTop: 14 }}>
          <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Your review</Text>
          <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK, marginTop: 4 }}>{listingReviewStatusLabel(mine.data.status)}</Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK, marginTop: 6 }}>{mine.data.rating} of 5</Text>
          {mine.data.title ? <Text style={{ fontFamily: 'Poppins_600SemiBold', marginTop: 6 }}>{mine.data.title}</Text> : null}
          <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, marginTop: 4, lineHeight: 20 }}>{mine.data.comment}</Text>
          <Pressable onPress={openForm} style={{ marginTop: 10 }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, textDecorationLine: 'underline' }}>Edit</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={openForm} style={{ marginTop: 14, alignSelf: 'flex-start' }}>
          <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, textDecorationLine: 'underline' }}>Write a review</Text>
        </Pressable>
      )}

      {note ? <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK, marginTop: 10 }}>{note}</Text> : null}

      {open ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK, marginBottom: 6 }}>Stars</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)} accessibilityRole="button" accessibilityLabel={`${value} star${value === 1 ? '' : 's'}`}>
                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: value <= rating ? LANDING_INK : LANDING_MUTED }}>{value}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title (optional)"
            maxLength={80}
            style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 10, padding: 10, marginTop: 10, fontFamily: 'Poppins_400Regular' }}
          />
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="What happened on this job?"
            multiline
            maxLength={2000}
            style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 10, padding: 10, marginTop: 10, minHeight: 90, fontFamily: 'Poppins_400Regular' }}
          />
          {error ? <Text style={{ color: '#B91C1C', marginTop: 8 }}>{error}</Text> : null}
          <Pressable
            onPress={() => save.mutate()}
            disabled={save.isPending || rating < 1 || comment.trim().length < 20}
            style={{ marginTop: 12, alignSelf: 'flex-start', backgroundColor: LANDING_INK, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, opacity: save.isPending || rating < 1 || comment.trim().length < 20 ? 0.5 : 1 }}
          >
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#fff' }}>{save.isPending ? 'Sending...' : 'Send review'}</Text>
          </Pressable>
        </View>
      ) : null}

      {rows.map((review, index) => (
        <View key={`${review.publishedAt}-${review.reviewerName}-${index}`} style={{ borderTopWidth: 1, borderTopColor: LANDING_BORDER, marginTop: 16, paddingTop: 14 }}>
          <View style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: LANDING_INK }}>{review.label}</Text>
          </View>
          <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginTop: 8 }}>
            {review.reviewerName}, {review.rating} of 5, {review.dateLabel}
          </Text>
          {review.title ? <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginTop: 4 }}>{review.title}</Text> : null}
          <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK, lineHeight: 22, marginTop: 4 }}>{review.comment}</Text>
        </View>
      ))}

      {page > 1 ? (
        <Pressable onPress={() => setPage((current) => Math.max(1, current - 1))} style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, textDecorationLine: 'underline' }}>Newer reviews</Text>
        </Pressable>
      ) : null}
      {summary && summary.count > page * 10 ? (
        <Pressable onPress={() => setPage((current) => current + 1)} style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, textDecorationLine: 'underline' }}>Older reviews</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
