import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(params: SendEmailParams) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: params,
  });

  if (error) throw new Error(error.message);
  return data;
}
