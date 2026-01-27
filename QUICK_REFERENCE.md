# Quick Reference - New Components

## Toast Notifications

```tsx
import { useToast } from './contexts/ToastContext';

const toast = useToast();

// Simple
toast.success('Done!');
toast.error('Failed!');
toast.warning('Warning!');
toast.info('Info!');

// With title
toast.success('Profile updated', 'Success');

// With action
toast.showToast({
  type: 'warning',
  message: 'Unsaved changes',
  action: { label: 'Save', onClick: () => save() }
});
```

## Form Components

```tsx
import { Input, Textarea, Select, Checkbox, Radio, RadioGroup } from './components/ui';

// Input
<Input
  label="Email"
  type="email"
  leftIcon={<Mail />}
  error="Invalid email"
  success="Looks good!"
  helperText="We'll never share"
  required
/>

// Textarea
<Textarea
  label="Bio"
  showCharCount
  maxLength={500}
  helperText="Tell us about yourself"
/>

// Select
<Select label="Role" required>
  <option value="">Select...</option>
  <option value="freelancer">Freelancer</option>
</Select>

// Checkbox
<Checkbox
  label="I agree"
  description="Terms and conditions"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
/>

// Radio
<RadioGroup label="Plan">
  <Radio label="Basic" value="basic" name="plan" />
  <Radio label="Pro" value="pro" name="plan" />
</RadioGroup>
```

## Modals

```tsx
import { Modal, ConfirmationModal } from './components/ui';

// Basic Modal
<Modal
  isOpen={open}
  onClose={close}
  title="Edit Profile"
  size="lg"
  footer={
    <>
      <Button variant="ghost" onClick={close}>Cancel</Button>
      <Button onClick={save}>Save</Button>
    </>
  }
>
  <FormContent />
</Modal>

// Confirmation Modal
<ConfirmationModal
  isOpen={open}
  onClose={close}
  onConfirm={handleDelete}
  title="Delete Item"
  message="Are you sure?"
  variant="danger"
  confirmText="Delete"
  cancelText="Cancel"
/>
```

## Button Variants

```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
<Button variant="glow">Glow</Button>
<Button variant="glass">Glass</Button>

<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>
```

## Input Variants

```tsx
// Sizes
<Input inputSize="sm" />
<Input inputSize="md" />
<Input inputSize="lg" />

// Variants
<Input variant="default" />
<Input variant="filled" />
<Input variant="minimal" />

// States
<Input error="Error message" />
<Input success="Success message" />
<Input helperText="Helper text" />
```

## Modal Variants

```tsx
<Modal variant="default" />
<Modal variant="confirmation" />
<Modal variant="danger" />
<Modal variant="success" />

<Modal size="sm" />
<Modal size="md" />
<Modal size="lg" />
<Modal size="xl" />
<Modal size="full" />
```

## CSS Utilities

```css
/* Spacing */
.container-padding  /* Responsive padding */
.section-spacing    /* Section vertical spacing */
.content-spacing    /* Content vertical spacing */

/* Focus */
.focus-ring         /* Standardized focus state */

/* Text */
.text-balance       /* Better text wrapping */
.text-glow          /* Glowing text effect */

/* Backgrounds */
.glass              /* Glassmorphism effect */
.glass-card         /* Glass card effect */
.glow-text          /* Glowing text shadow */
```

## Tailwind Animations

```tsx
className="animate-fade-in"
className="animate-fade-in-up"
className="animate-fade-in-down"
className="animate-slide-in-right"
className="animate-slide-in-left"
className="animate-slide-up"
className="animate-scale-in"
className="animate-bounce-subtle"
className="animate-glow-pulse"
className="animate-gradient"
className="animate-spin-slow"
className="animate-pulse-slow"
```

## Common Patterns

### Form with Validation
```tsx
<form onSubmit={handleSubmit}>
  <Input
    label="Email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    error={errors.email}
    required
  />
  
  <Button type="submit" loading={isSubmitting}>
    Submit
  </Button>
</form>
```

### Delete Confirmation
```tsx
const [showConfirm, setShowConfirm] = useState(false);

<Button onClick={() => setShowConfirm(true)} variant="danger">
  Delete
</Button>

<ConfirmationModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={async () => {
    await deleteItem();
    toast.success('Deleted successfully');
    setShowConfirm(false);
  }}
  title="Delete Item"
  message="This action cannot be undone."
  variant="danger"
/>
```

### Form with Toast Feedback
```tsx
const toast = useToast();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await saveData();
    toast.success('Saved successfully!');
  } catch (error) {
    toast.error('Failed to save');
  }
};
```

### Multi-field Form
```tsx
<div className="space-y-6">
  <Input label="Name" required />
  <Input label="Email" type="email" required />
  <Textarea label="Bio" showCharCount maxLength={500} />
  <Select label="Role" required>
    <option value="">Select...</option>
  </Select>
  <Checkbox label="I agree to terms" required />
</div>
```

## Tips

1. **Always use `useToast` hook** for notifications instead of alerts
2. **Use `ConfirmationModal`** for destructive actions
3. **Add `helperText`** to inputs for better UX
4. **Use `loading` prop** on buttons during async operations
5. **Add `required` prop** to form fields for validation
6. **Use `error` and `success` props** for real-time validation feedback
7. **Use `showCharCount`** on textareas with `maxLength`
8. **Add `description`** to checkboxes/radios for clarity
9. **Use appropriate button `variant`** for action importance
10. **Use `size` props** for visual hierarchy
