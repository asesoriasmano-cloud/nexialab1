import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendAppointmentConfirmation({
  to,
  clientName,
  serviceName,
  staffName,
  date,
  time,
  businessName,
  businessPhone,
}: {
  to: string
  clientName: string
  serviceName: string
  staffName: string
  date: string
  time: string
  businessName: string
  businessPhone?: string
}) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `Confirmación de cita - ${businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">CitaPro</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Sistema de Reservas</p>
        </div>
        <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">¡Tu cita está confirmada!</h2>
          <p style="color: #6b7280;">Hola <strong style="color: #1f2937;">${clientName}</strong>,</p>
          <p style="color: #6b7280;">Tu cita ha sido confirmada con los siguientes detalles:</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #8B5CF6;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">Servicio:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${serviceName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Profesional:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${staffName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Fecha:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Hora:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Negocio:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${businessName}</td>
              </tr>
              ${businessPhone ? `<tr><td style="padding: 8px 0; color: #6b7280;">Teléfono:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${businessPhone}</td></tr>` : ''}
            </table>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Si necesitas cancelar o reprogramar tu cita, contáctanos con al menos 24 horas de anticipación.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">Enviado por CitaPro · Sistema de Reservas</p>
        </div>
      </div>
    `,
  })
}

export async function sendAppointmentReminder({
  to,
  clientName,
  serviceName,
  date,
  time,
  businessName,
  hoursUntil,
}: {
  to: string
  clientName: string
  serviceName: string
  date: string
  time: string
  businessName: string
  hoursUntil: number
}) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `Recordatorio: Tu cita es ${hoursUntil === 24 ? 'mañana' : 'en 2 horas'} - ${businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">CitaPro</h1>
        </div>
        <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Recordatorio de cita</h2>
          <p style="color: #6b7280;">Hola <strong style="color: #1f2937;">${clientName}</strong>,</p>
          <p style="color: #6b7280;">Te recordamos que tienes una cita <strong>${hoursUntil === 24 ? 'mañana' : 'en aproximadamente 2 horas'}</strong>:</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #EC4899;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">Servicio:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${serviceName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Fecha:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Hora:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Negocio:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${businessName}</td>
              </tr>
            </table>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">Enviado por CitaPro · Sistema de Reservas</p>
        </div>
      </div>
    `,
  })
}

export async function sendAppointmentCancellation({
  to,
  clientName,
  serviceName,
  date,
  time,
  businessName,
  reason,
}: {
  to: string
  clientName: string
  serviceName: string
  date: string
  time: string
  businessName: string
  reason?: string
}) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `Cita cancelada - ${businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ef4444; padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">CitaPro</h1>
        </div>
        <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Cita cancelada</h2>
          <p style="color: #6b7280;">Hola <strong>${clientName}</strong>,</p>
          <p style="color: #6b7280;">Lamentamos informarte que tu cita ha sido cancelada:</p>
          <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p><strong>Servicio:</strong> ${serviceName}</p>
            <p><strong>Fecha:</strong> ${date}</p>
            <p><strong>Hora:</strong> ${time}</p>
            ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
          </div>
          <p style="color: #6b7280;">Por favor contáctanos para reagendar tu cita.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">Enviado por CitaPro</p>
        </div>
      </div>
    `,
  })
}
