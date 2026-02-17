# 📧 Email Report Feature - Quick Start

## ⚡ 3-MINUTE SETUP

### **1. Run Database Migration** (2 min)

```sql
-- Go to Supabase Dashboard → SQL Editor
-- Copy/paste contents of MIGRATION_EMAIL_REPORTS.sql
-- Click "Run"
```

### **2. Update Sender Email** (1 min)

```env
# In .env file, change this line:
REPORT_FROM_EMAIL=onboarding@resend.dev

# (Get the test domain from https://resend.com/domains)
```

### **3. Test It!** (1 min)

1. Login as admin
2. Go to Reports → Export
3. Click "Send to Email"
4. Check: vivekjangam9767@gmail.com

---

## ✅ DONE!

That's it! The feature is ready to use.

---

## 🎯 What You Get

- Professional email with PDF attachment
- Same PDF quality as download
- Automatic delivery to HR email
- Delivery tracking in database
- Success/failure notifications

---

## 📧 Email Goes To

**Default:** vivekjangam9767@gmail.com

**To Change:**
```sql
UPDATE email_report_settings
SET hr_email = 'newemail@company.com';
```

---

## 🐛 If Something Goes Wrong

**Email not sending?**
→ Make sure `REPORT_FROM_EMAIL=onboarding@resend.dev`

**Not received?**
→ Check spam folder
→ Check `email_report_logs` table

**Need help?**
→ Read `EMAIL_REPORT_SETUP_GUIDE.md`

---

## 💡 Pro Tips

1. Use Resend test domain for quick testing
2. Add your own domain later for production
3. Check email logs in database for debugging
4. PDF is generated on server (no client download)

---

**Ready to send your first report? Click that button! 🚀**
