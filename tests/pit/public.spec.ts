import { describe, expect, it } from 'vitest';

import {
  groupBreakdownsForCount,
  pickFeaturedSummary,
  sortSummariesByWindow,
} from '@/lib/pit/public';

describe('PIT helpers', () => {
  describe('sortSummariesByWindow', () => {
    it('orders by observed_start then fallback to last observation', () => {
      const sorted = sortSummariesByWindow([
        {
          id: 'b',
          slug: 'b',
          title: 'Second',
          description: null,
          status: 'closed',
          is_active: false,
          observed_start: '2024-10-20T00:00:00Z',
          observed_end: '2024-10-20T12:00:00Z',
          municipality: null,
          methodology: null,
          updated_at: '2024-10-20T12:00:00Z',
          last_observation_at: '2024-10-20T11:59:00Z',
          total_encounters: 12,
          wants_treatment_yes_count: 6,
          wants_treatment_no_count: 4,
          wants_treatment_not_suitable_count: 0,
          wants_treatment_not_applicable_count: 2,
          addiction_positive_count: 4,
          mental_health_positive_count: 2,
          homelessness_confirmed_count: 10,
        } as any,
        {
          id: 'a',
          slug: 'a',
          title: 'First',
          description: null,
          status: 'closed',
          is_active: false,
          observed_start: '2024-10-18T00:00:00Z',
          observed_end: '2024-10-18T12:00:00Z',
          municipality: null,
          methodology: null,
          updated_at: '2024-10-18T12:00:00Z',
          last_observation_at: '2024-10-18T11:59:00Z',
          total_encounters: 8,
          wants_treatment_yes_count: 4,
          wants_treatment_no_count: 3,
          wants_treatment_not_suitable_count: 0,
          wants_treatment_not_applicable_count: 1,
          addiction_positive_count: 3,
          mental_health_positive_count: 1,
          homelessness_confirmed_count: 6,
        } as any,
      ]);

      expect(sorted.map((entry) => entry.id)).toEqual(['a', 'b']);
    });
  });

  describe('pickFeaturedSummary', () => {
    it('prefers an active window when present', () => {
      const featured = pickFeaturedSummary([
        { id: 'past', is_active: false, observed_start: '2024-10-01', last_observation_at: '2024-10-01', total_encounters: 5 } as any,
        { id: 'live', is_active: true, observed_start: '2024-10-22', last_observation_at: '2024-10-22', total_encounters: 7 } as any,
      ]);

      expect(featured?.id).toBe('live');
    });

    it('falls back to the most recent window when none are active', () => {
      const featured = pickFeaturedSummary([
        { id: 'older', is_active: false, observed_start: '2024-10-01', last_observation_at: '2024-10-01', total_encounters: 5 } as any,
        { id: 'newer', is_active: false, observed_start: '2024-10-10', last_observation_at: '2024-10-10', total_encounters: 3 } as any,
      ]);

      expect(featured?.id).toBe('newer');
    });
  });

  describe('groupBreakdownsForCount', () => {
    it('filters and sorts breakdown rows for the requested count', () => {
      const grouped = groupBreakdownsForCount(
        [
          {
            pit_count_id: 'abc',
            dimension: 'age_bracket',
            dimension_label: 'Age',
            dimension_sort: 1,
            bucket: 'age_20_39',
            bucket_label: '20 to 39',
            bucket_sort: 2,
            total: 4,
            percentage: 50,
            suppressed: false,
            suppressed_reason: null,
            total_encounters: 8,
            last_observation_at: '2024-10-18',
          },
          {
            pit_count_id: 'abc',
            dimension: 'age_bracket',
            dimension_label: 'Age',
            dimension_sort: 1,
            bucket: 'under_19',
            bucket_label: 'Under 19',
            bucket_sort: 1,
            total: 3,
            percentage: 37.5,
            suppressed: false,
            suppressed_reason: null,
            total_encounters: 8,
            last_observation_at: '2024-10-18',
          },
          {
            pit_count_id: 'def',
            dimension: 'age_bracket',
            dimension_label: 'Age',
            dimension_sort: 1,
            bucket: 'age_40_59',
            bucket_label: '40 to 59',
            bucket_sort: 3,
            total: 2,
            percentage: null,
            suppressed: true,
            suppressed_reason: 'Less than 3 neighbours responded',
            total_encounters: 2,
            last_observation_at: '2024-10-21',
          },
        ],
        'abc',
      );

      expect(grouped).toHaveLength(1);
      expect(grouped[0].rows.map((row) => row.bucket)).toEqual(['under_19', 'age_20_39']);
    });
  });
});
