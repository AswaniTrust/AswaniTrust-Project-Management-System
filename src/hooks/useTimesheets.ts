import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { TimesheetEntry, User } from '@/types';
import { toast } from 'sonner';

export function useTimesheets(currentUserProfileId: string | undefined) {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClockEntry, setActiveClockEntry] = useState<TimesheetEntry | undefined>();

  const fetchEntries = useCallback(async () => {
    if (!currentUserProfileId) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.timesheets.getMy({});

      const mappedEntries: TimesheetEntry[] = (data || []).map((entry: any) => ({
        id: entry.id,
        userId: entry.user_id,
        user: {
          id: entry.user_id,
          name: entry.user_name || 'Unknown',
          email: '',
          role: 'backend_developer' as User['role'],
        },
        date: new Date(entry.date),
        projectId: entry.project_id || undefined,
        taskId: entry.task_id || undefined,
        description: entry.description,
        entryType: entry.entry_type as 'duration' | 'clock',
        hours: entry.hours || undefined,
        minutes: entry.minutes || undefined,
        startTime: entry.start_time || undefined,
        endTime: entry.end_time || undefined,
        totalMinutes: entry.total_minutes,
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at),
      }));

      setEntries(mappedEntries);

      const active = mappedEntries.find(
        e => e.entryType === 'clock' && e.startTime && !e.endTime
      );
      setActiveClockEntry(active);
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
      toast.error('Failed to load timesheet entries');
    } finally {
      setLoading(false);
    }
  }, [currentUserProfileId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async (entryData: Partial<TimesheetEntry>): Promise<TimesheetEntry | null> => {
    if (!currentUserProfileId) {
      toast.error('User not found');
      return null;
    }

    try {
      const data = await api.timesheets.create({
        date: entryData.date ? entryData.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        project_id: entryData.projectId || null,
        task_id: entryData.taskId || null,
        description: entryData.description || '',
        entry_type: entryData.entryType || 'duration',
        hours: entryData.hours || null,
        minutes: entryData.minutes || null,
        start_time: entryData.startTime || null,
        end_time: entryData.endTime || null,
        total_minutes: entryData.totalMinutes || 0,
      });

      const newEntry: TimesheetEntry = {
        id: data.id,
        userId: data.user_id,
        user: {
          id: data.user_id,
          name: 'Current User',
          email: '',
          role: 'backend_developer' as User['role'],
        },
        date: new Date(data.date),
        projectId: data.project_id || undefined,
        taskId: data.task_id || undefined,
        description: data.description,
        entryType: data.entry_type as 'duration' | 'clock',
        hours: data.hours || undefined,
        minutes: data.minutes || undefined,
        startTime: data.start_time || undefined,
        endTime: data.end_time || undefined,
        totalMinutes: data.total_minutes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setEntries(prev => [newEntry, ...prev]);

      if (newEntry.entryType === 'clock' && newEntry.startTime && !newEntry.endTime) {
        setActiveClockEntry(newEntry);
      }

      return newEntry;
    } catch (error) {
      console.error('Error adding timesheet entry:', error);
      toast.error('Failed to add time entry');
      return null;
    }
  };

  const updateEntry = async (id: string, updates: Partial<TimesheetEntry>): Promise<boolean> => {
    try {
      await api.timesheets.update(id, {
        date: updates.date ? updates.date.toISOString().split('T')[0] : undefined,
        project_id: updates.projectId === undefined ? undefined : (updates.projectId || null),
        task_id: updates.taskId === undefined ? undefined : (updates.taskId || null),
        description: updates.description,
        entry_type: updates.entryType,
        hours: updates.hours === undefined ? undefined : (updates.hours || null),
        minutes: updates.minutes === undefined ? undefined : (updates.minutes || null),
        start_time: updates.startTime === undefined ? undefined : (updates.startTime || null),
        end_time: updates.endTime === undefined ? undefined : (updates.endTime || null),
        total_minutes: updates.totalMinutes,
      });

      setEntries(prev =>
        prev.map(e =>
          e.id === id
            ? { ...e, ...updates, updatedAt: new Date() }
            : e
        )
      );

      if (activeClockEntry?.id === id) {
        if (updates.endTime) {
          setActiveClockEntry(undefined);
        } else {
          setActiveClockEntry(prev => prev ? { ...prev, ...updates } : undefined);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating timesheet entry:', error);
      toast.error('Failed to update time entry');
      return false;
    }
  };

  const deleteEntry = async (id: string): Promise<boolean> => {
    try {
      await api.timesheets.delete(id);
      setEntries(prev => prev.filter(e => e.id !== id));

      if (activeClockEntry?.id === id) {
        setActiveClockEntry(undefined);
      }

      toast.success('Time entry deleted');
      return true;
    } catch (error) {
      console.error('Error deleting timesheet entry:', error);
      toast.error('Failed to delete time entry');
      return false;
    }
  };

  const clockOut = async (entry: TimesheetEntry, endTime: string, totalMinutes: number): Promise<boolean> => {
    const success = await updateEntry(entry.id, { endTime, totalMinutes });
    if (success) {
      setActiveClockEntry(undefined);
      toast.success('Clocked out successfully');
    }
    return success;
  };

  return {
    entries,
    loading,
    activeClockEntry,
    addEntry,
    updateEntry,
    deleteEntry,
    clockOut,
    refetch: fetchEntries,
  };
}
