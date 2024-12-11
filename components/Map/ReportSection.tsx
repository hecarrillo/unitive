import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useSupabase } from '@/app/supabase-provider';

interface ReportSectionProps {
    locationId: string;
    onReportSubmitted: () => void;
    userReport?: {
      id: string;
      body: string;
    } | null;
    onClose: () => void;
  }

  const ReportSection: React.FC<ReportSectionProps> = ({ 
    locationId, 
    onReportSubmitted,
    userReport: initialUserReport,
    onClose
  }) => {
    const [isReporting, setIsReporting] = useState(false);
    const [report, setReport] = useState(initialUserReport?.body || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userReport, setUserReport] = useState(initialUserReport);
    
    const { supabase } = useSupabase();
    const { toast } = useToast();
  
    const handleSubmitReport = async () => {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a report",
          variant: "destructive",
        });
        return;
      }
  
      if (report.length < 10) {
        toast({
          title: "Error",
          description: "Report must be at least 10 characters long",
          variant: "destructive",
        });
        return;
      }
  
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationId,
            body: report,
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to submit report');
        }
  
        const newReport = await response.json();
        setUserReport(newReport);
        setIsReporting(false);
  
        toast({
          title: "Success",
          description: "Your report has been submitted",
        });
        onReportSubmitted();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to submit report. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };
  
    const handleDeleteReport = async () => {
      if (!userReport) return;
  
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete a report",
          variant: "destructive",
        });
        return;
      }
  
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/reports/${userReport.id}`, {
          method: 'DELETE',
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete report');
        }
  
        setUserReport(null);
        setReport('');
        setIsReporting(false);
        
        toast({
          title: "Success",
          description: "Your report has been deleted",
        });
        onReportSubmitted();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete report. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };
  
    return (
      <div className="border-t border-b py-4">
        {userReport && !isReporting ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Report</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsReporting(true)}
                  variant="outline"
                  size="sm"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={handleDeleteReport}
                  variant="destructive"
                  size="sm"
                  disabled={isSubmitting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
  
            {/* Display Report */}
            <p className="text-gray-700 mt-2">{userReport.body}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {userReport ? 'Edit Your Report' : 'Report Location'}
            </h3>
            
            {/* Report Text */}
            <Textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              placeholder="Describe the issue with this location (minimum 10 characters)..."
              className="w-full min-h-[100px] resize-y"
            />
  
            {/* Submit/Cancel Buttons */}
            <div className="flex justify-end gap-2">
                <Button
                    onClick={() => {
                    onClose();
                    setIsReporting(false);
                    setReport(userReport?.body || '');
                    }}
                    variant="outline"
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={isSubmitting || report.length < 10}
              >
                {isSubmitting ? 'Submitting...' : (userReport ? 'Update Report' : 'Submit Report')}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

export default ReportSection;