import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Loader2, CheckCircle, AlertCircle, Phone } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppTest() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState([]);
  
  const [testConfig, setTestConfig] = useState({
    phone_number: "",
    reminder_type: "medication",
    medication_name: "Metformin",
    language: "english"
  });

  useEffect(() => {
    appClient.auth.me()
      .then(u => {
        setUser(u);
        if (u.role !== 'admin') {
          toast.error("Admin access required");
        }
      })
      .catch(() => toast.error("Please log in"))
      .finally(() => setLoading(false));
  }, []);

  const sendTestReminder = async () => {
    if (!testConfig.phone_number) {
      toast.error("Enter a phone number");
      return;
    }
    
    setSending(true);
    const startTime = Date.now();
    
    try {
      const response = await appClient.functions.invoke('sendWhatsAppReminder', {
        phone_number: testConfig.phone_number.replace(/\D/g, ''),
        reminder_type: testConfig.reminder_type,
        medication_name: testConfig.medication_name,
        language: testConfig.language
      });

      const duration = Date.now() - startTime;
      
      setResults(prev => [{
        id: Date.now(),
        type: testConfig.reminder_type,
        phone: testConfig.phone_number,
        success: !response.data?.error,
        message: response.data?.message_sent || response.data?.error,
        duration,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 9)]);

      if (response.data?.error) {
        toast.error(`Failed: ${response.data.error}`);
      } else {
        toast.success("Message sent!");
      }
    } catch (error) {
      setResults(prev => [{
        id: Date.now(),
        type: testConfig.reminder_type,
        phone: testConfig.phone_number,
        success: false,
        message: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 9)]);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-600" />
            WhatsApp Test Console
          </h1>
          <p className="text-slate-500 mt-1">Test WhatsApp reminders before going live</p>
        </div>

        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Send Test Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Phone Number (with country code)</Label>
              <div className="flex gap-2 mt-1.5">
                <div className="flex items-center px-3 bg-slate-100 rounded-l-lg border border-r-0">
                  <Phone className="w-4 h-4 text-slate-500 mr-1" />
                  <span className="text-sm">+</span>
                </div>
                <Input
                  placeholder="919876543210"
                  value={testConfig.phone_number}
                  onChange={(e) => setTestConfig(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="rounded-l-none"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Include country code (91 for India)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reminder Type</Label>
                <Select
                  value={testConfig.reminder_type}
                  onValueChange={(val) => setTestConfig(prev => ({ ...prev, reminder_type: val }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medication">💊 Medication</SelectItem>
                    <SelectItem value="glucose">🩸 Glucose Check</SelectItem>
                    <SelectItem value="appointment">📅 Appointment</SelectItem>
                    <SelectItem value="general">💚 General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Language</Label>
                <Select
                  value={testConfig.language}
                  onValueChange={(val) => setTestConfig(prev => ({ ...prev, language: val }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="hinglish">Hinglish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {testConfig.reminder_type === 'medication' && (
              <div>
                <Label>Medication Name</Label>
                <Input
                  value={testConfig.medication_name}
                  onChange={(e) => setTestConfig(prev => ({ ...prev, medication_name: e.target.value }))}
                  placeholder="e.g., Metformin"
                  className="mt-1.5"
                />
              </div>
            )}

            <Button
              onClick={sendTestReminder}
              disabled={sending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Test Message
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map(result => (
                  <div
                    key={result.id}
                    className={`p-3 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-medium text-sm">
                          {result.type} → {result.phone}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {result.timestamp} ({result.duration}ms)
                      </span>
                    </div>
                    {result.message && (
                      <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap">
                        {result.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-slate-50">
          <CardContent className="pt-4">
            <h4 className="font-medium text-slate-700 mb-2">Testing Replies</h4>
            <p className="text-sm text-slate-600 mb-3">
              After receiving the test message, try replying with:
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• <code className="bg-slate-200 px-1 rounded">120 fasting</code> - Log a sugar reading</li>
              <li>• <code className="bg-slate-200 px-1 rounded">sugar 145</code> - Log a sugar reading</li>
              <li>• <code className="bg-slate-200 px-1 rounded">done</code> or <code className="bg-slate-200 px-1 rounded">taken</code> - Confirm medication</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}