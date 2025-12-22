# Adding New Email Templates

## Overview

This guide explains how to create new email templates for your application. All email templates follow a consistent structure with dark backgrounds and blue/green gradients.

---

## Template Structure

### File Location
All email templates are located in: `backend/email_templates/`

### Required Files
- **`base.html`** - Contains all shared CSS styles (DO NOT duplicate styles)
- **Individual templates** - e.g., `verify_email.html`, etc.

---

## Step-by-Step Guide

### 1. Add CSS Styles to `base.html` (If Needed)

**IMPORTANT:** Only edit the `<style>` tag in `base.html`. Do not edit anything else.

If your new template requires custom styling (e.g., special boxes, layouts):

```css
/* Add new styles inside the <style> tag in base.html */
.your-new-class {
    /* Your styles here */
}
```

**Existing Available Classes:**
- `.container` - Main glass morphism container
- `.code` - Verification code/token display
- `.info` - Blue-bordered information container
- `.warning` - Red warning box
- `.success` - Green success box
- `.button` - Call-to-action button
- `.link` - Styled link
- `.footer` - Email footer
- `h1` - Gradient heading
- `p` - Paragraph text

---

### 2. Create New Template File

**Template Structure:**
Every email template MUST follow this exact structure:

```html
    <div class="container">
        <h1>Your Email Title</h1>
        <p>Your content here...</p>
        
        <!-- Use existing classes from base.html -->
        <div class="info">
            <strong>Note:</strong><br>
            Additional information here.
        </div>
        
        <a href="{base_url}/action" class="button">Take Action</a>
        
        <div class="footer">
            <p>Best regards,<br>The {app_name} Team</p>
            <p style="margin-top: 16px;">
                <a href="{base_url}" class="link">{base_url}</a>
            </p>
        </div>
    </div>
</body>
</html>
```

**Key Points:**
- ✅ Start with `<div class="container">`
- ✅ End with `</body>` and `</html>`
- ✅ Use template variables in curly braces: `{variable_name}`
- ✅ Use existing CSS classes from `base.html`
- ❌ DO NOT include `<html>`, `<head>`, or `<body>` opening tags
- ❌ DO NOT add `<style>` tags in individual templates
- ❌ DO NOT duplicate CSS from `base.html`

---

### 3. Template Variables

**Common Variables:**
- `{app_name}` - Your application name (from environment variable)
- `{base_url}` - Frontend URL (from environment variable)
- `{name}` - User's name
- `{email}` - User's email address

**Custom Variables:**
Define any additional variables needed for your template, e.g.:
- `{code}` - Verification code
- `{subject}` - Email subject
- `{message}` - Message content
- `{date}` - Date/time
- `{order_id}` - Order reference

---

### 4. Example Templates

#### Example 1: Simple Notification
```html
    <div class="container">
        <h1>Welcome to {app_name}</h1>
        <p>Hi {name},</p>
        <p>Thank you for joining our community!</p>
        <div class="footer">
            <p>Best regards,<br>The {app_name} Team</p>
            <p style="margin-top: 16px;">
                <a href="{base_url}" class="link">{base_url}</a>
            </p>
        </div>
    </div>
</body>
</html>
```

#### Example 2: Verification Code
```html
    <div class="container">
        <h1>Email Verification</h1>
        <p>Thank you for registering with {app_name}!</p>
        <p>Please verify your email address using the code below:</p>
        
        <div class="code">{code}</div>
        
        <div class="info">
            <strong>Security Note:</strong><br>
            This code will expire in 10 minutes.
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The {app_name} Team</p>
            <p style="margin-top: 16px;">
                <a href="{base_url}" class="link">{base_url}</a>
            </p>
        </div>
    </div>
</body>
</html>
```

#### Example 3: Action Required
```html
    <div class="container">
        <h1>Password Reset</h1>
        <p>Hi {name},</p>
        <p>We received a request to reset your password.</p>
        
        <a href="{base_url}/reset?token={token}" class="button">Reset Password</a>
        
        <div class="warning">
            <strong>Warning:</strong><br>
            This link expires in 1 hour. If you didn't request this, please ignore this email.
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The {app_name} Team</p>
            <p style="margin-top: 16px;">
                <a href="{base_url}" class="link">{base_url}</a>
            </p>
        </div>
    </div>
</body>
</html>
```

---

### 5. Using Templates in Backend Code

**Using `get_template()` function**

```python
from utils.mail import sendmail, get_template

# Render template with variables
email_html = get_template(
    'your_template_name',  # Without .html extension
    name='John Doe',
    email='john@example.com',
    code='123456',
    app_name='MyApp',
    base_url='http://localhost'
)

# Send email
sendmail(
    receiver='john@example.com',
    subject='Email Subject',
    html=email_html
)
```

**How `get_template()` works:**
```python
# In utils/mail.py
def get_template(name: str, **kwargs: Any) -> str:
    """Get Email Template"""
    with open("email_templates/base.html", "r") as f:
        base_template = f.read()
    with open(f"email_templates/{name}.html", "r") as f:
        template = f.read()
    return base_template + template.format(**kwargs)
```

This function:
1. Reads `base.html` (contains all styles and opening HTML)
2. Reads your template file (contains content only)
3. Combines them: `base.html + your_template.html`
4. Replaces all `{variable}` placeholders with actual values

---

### 6. CSS Styling Guidelines

**When to Add New CSS Classes:**
Add new classes to `base.html` if you need:
- New container types (e.g., custom message boxes)
- Special text formatting
- Custom button styles
- Unique layout components

**Where to Add:**
```html
<!-- In base.html, inside the <style> tag -->
<style>
    /* Existing styles... */
    
    /* Your new styles at the end */
    .custom-box {
        background: rgba(59, 130, 246, 0.1);
        border-left: 4px solid #3b82f6;
        padding: 16px;
        margin: 16px 0;
        border-radius: 8px;
    }
</style>
```

**CSS Best Practices:**
- ✅ Use blue/green color scheme (#3b82f6, #10b981)
- ✅ Maintain glass morphism aesthetic (`backdrop-filter: blur()`)
- ✅ Keep consistent border-radius (8px for boxes, 16px for containers)
- ✅ Use rgba() colors for transparency
- ✅ Ensure good contrast for readability
- ❌ Avoid complex animations (email clients don't support them)
- ❌ Don't use external fonts (stick to system font stack)

---

### 7. Email Client Compatibility

**Safe CSS Properties:**
- ✅ `background`, `background-color`
- ✅ `border`, `border-radius`
- ✅ `padding`, `margin`
- ✅ `color`, `font-size`, `font-weight`
- ✅ `text-align`, `line-height`

**Limited Support:**
- ⚠️ `backdrop-filter` (fallback to solid backgrounds)
- ⚠️ Gradients (fallback to solid colors)
- ⚠️ Advanced animations (disabled in most email clients)

**Always Provide Fallbacks:**
```css
.container {
    background: rgba(15, 23, 42, 0.5);  /* Fallback */
    backdrop-filter: blur(16px);         /* Enhancement */
}
```

---

### 8. Testing New Templates

**Step 1: Create Test Script**
```python
# backend/test_email.py
from utils.mail import sendmail, get_template
import os

email_html = get_template(
    'your_template_name',
    name='Test User',
    email='test@example.com',
    app_name=os.getenv('APP_NAME', 'MyApp'),
    base_url=os.getenv('BASE_URL', 'http://localhost')
)

sendmail(
    receiver='your-email@example.com',
    subject='Test Email',
    html=email_html
)
```

**Step 2: Run Test**
```bash
cd backend
python test_email.py
```

**Step 3: Check Email**
- Verify in Gmail, Outlook, Apple Mail
- Test on mobile devices
- Check all links work
- Ensure variables are replaced correctly

---

## Quick Reference

### Available CSS Classes
```css
.container          /* Main glass box */
.code              /* Verification code display */
.info              /* Blue information box */
.warning           /* Red warning box */
.success           /* Green success box */
.button            /* Call-to-action button */
.link              /* Styled link */
.footer            /* Email footer */
h1                 /* Gradient heading */
p                  /* Paragraph text */
```

### Template Variable Format
```
{variable_name}    /* Variables use curly braces */
```

### Color Palette
```css
/* Primary Colors */
Blue: #3b82f6 (rgb(59, 130, 246))
Green: #10b981 (rgb(16, 185, 129))

/* Light Variants */
Light Blue: #60a5fa
Light Green: #34d399

/* Background */
Dark: #020617
Container: rgba(15, 23, 42, 0.5)

/* Text */
Light: #f1f5f9
Gray: #cbd5e1
Muted: #94a3b8
```

---

## Common Mistakes to Avoid

❌ **Don't do this:**
```html
<!-- DON'T include full HTML structure -->
<!DOCTYPE html>
<html>
<head>
    <style>/* styles */</style>
</head>
<body>
    <div class="container">...</div>
</body>
</html>
```

✅ **Do this instead:**
```html
<!-- Only include container content -->
    <div class="container">
        <h1>Title</h1>
        <p>Content...</p>
    </div>
</body>
</html>
```

---

## Checklist for New Templates

Before committing a new email template:

- [ ] Template starts with `<div class="container">`
- [ ] Template ends with `</body></html>`
- [ ] No duplicate `<html>`, `<head>`, or opening `<body>` tags
- [ ] All custom styles added to `base.html` `<style>` tag
- [ ] Template variables in `{curly_braces}` format
- [ ] Tested with `get_template()` function
- [ ] Email sent successfully via `sendmail()`
- [ ] Tested in multiple email clients
- [ ] All variables replaced correctly
- [ ] Links work properly

---

## Need Help?

**Reference Files:**
- `backend/email_templates/base.html` - Base template with all styles
- `backend/email_templates/verify_email.html` - Example template
- `backend/utils/mail.py` - Email sending functions
