import axios from 'axios';
import { CanvasAssignment, CanvasCourse } from '../types';
import { getCourseColor } from '../utils/colors';

export interface CanvasFetchResult {
  assignments: CanvasAssignment[];
  courses: CanvasCourse[];
}

/**
 * Fetches assignments and courses from the Canvas LMS REST API.
 * Requires a valid Canvas base URL and an API access token.
 *
 * Canvas API docs: https://canvas.instructure.com/doc/api/
 */
export async function fetchCanvasData(
  baseUrl: string,
  token: string
): Promise<CanvasFetchResult> {
  // Normalize URL — remove trailing slash
  const base = baseUrl.replace(/\/+$/, '');
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch active enrollments (courses)
  const coursesRes = await axios.get(`${base}/api/v1/courses`, {
    headers,
    params: {
      enrollment_state: 'active',
      per_page: 50,
    },
    timeout: 15000,
  });

  const rawCourses: CanvasCourse[] = coursesRes.data
    .filter((c: any) => c.name && !c.access_restricted_by_date)
    .map((c: any, i: number) => ({
      id: String(c.id),
      name: c.name,
      code: c.course_code || c.name,
      color: getCourseColor(i),
    }));

  // Fetch upcoming assignments for each course (paginated)
  const assignmentPromises = rawCourses.map((course) =>
    axios
      .get(`${base}/api/v1/courses/${course.id}/assignments`, {
        headers,
        params: {
          per_page: 50,
          order_by: 'due_at',
          bucket: 'upcoming',
        },
        timeout: 15000,
      })
      .then((res) =>
        (res.data as any[]).map((a): CanvasAssignment => ({
          id: String(a.id),
          courseId: course.id,
          courseName: course.name,
          courseColor: course.color,
          title: a.name,
          description: stripHtml(a.description || ''),
          dueDate: a.due_at ? new Date(a.due_at) : null,
          pointsPossible: a.points_possible,
          submissionType: a.submission_types || [],
          submitted: a.has_submitted_submissions ?? false,
          grade: null,
          url: a.html_url,
        }))
      )
      .catch(() => [] as CanvasAssignment[])
  );

  const assignmentArrays = await Promise.all(assignmentPromises);
  const assignments = assignmentArrays
    .flat()
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

  return { assignments, courses: rawCourses };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Validate that a URL looks like a Canvas instance
export function validateCanvasUrl(url: string): string | null {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (!u.hostname) return 'Invalid URL';
    return null;
  } catch {
    return 'Please enter a valid URL (e.g. https://canvas.university.edu)';
  }
}
