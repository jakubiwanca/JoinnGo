import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  TitleField,
  CategoryField,
  DescriptionField,
  PrivateCheckbox,
  MaxParticipantsField,
  RecurringCheckbox,
  RecurrenceConfig,
} from '../../components/EventFormFields'

jest.mock('../../constants/categories', () => ({
  EVENT_CATEGORIES: [
    { id: 1, name: 'Sport' },
    { id: 2, name: 'Kultura' },
    { id: 3, name: 'Rozrywka' },
  ],
}))

jest.mock('../../constants/common', () => ({
  DAYS_OF_WEEK: [
    { value: 0, label: 'Nd' },
    { value: 1, label: 'Pn' },
    { value: 2, label: 'Wt' },
    { value: 3, label: 'Śr' },
    { value: 4, label: 'Cz' },
    { value: 5, label: 'Pt' },
    { value: 6, label: 'Sb' },
  ],
}))

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
}))

jest.mock('../../components/MapComponents', () => ({
  LocationMarker: () => <div data-testid="location-marker" />,
  MapUpdater: () => <div data-testid="map-updater" />,
}))

jest.mock('../../components/LocationAutocomplete', () => ({ value, onChange, placeholder }) => (
  <input
    data-testid="location-autocomplete"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
  />
))

jest.mock('react-datepicker', () => ({ selected, onChange, placeholderText }) => (
  <input
    data-testid="date-picker"
    value={selected ? selected.toISOString() : ''}
    onChange={(e) => onChange(new Date(e.target.value))}
    placeholder={placeholderText}
  />
))

describe('TitleField', () => {
  it('renders with label and input', () => {
    const handleChange = jest.fn()
    render(<TitleField value="" onChange={handleChange} />)

    expect(screen.getByText('Tytuł:')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Np. Mecz piłki nożnej')).toBeInTheDocument()
  })

  it('displays the provided value', () => {
    render(<TitleField value="Test Event" onChange={jest.fn()} />)

    expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument()
  })

  it('calls onChange when typing', () => {
    const handleChange = jest.fn()
    render(<TitleField value="" onChange={handleChange} />)

    const input = screen.getByPlaceholderText('Np. Mecz piłki nożnej')
    fireEvent.change(input, { target: { value: 'New Title' } })

    expect(handleChange).toHaveBeenCalled()
  })

  it('displays error message when provided', () => {
    render(<TitleField value="" onChange={jest.fn()} error="Tytuł jest wymagany" />)

    expect(screen.getByText('Tytuł jest wymagany')).toBeInTheDocument()
  })

  it('does not display error when not provided', () => {
    render(<TitleField value="" onChange={jest.fn()} />)

    expect(screen.queryByText('Tytuł jest wymagany')).not.toBeInTheDocument()
  })
})

describe('CategoryField', () => {
  it('renders with label and select', () => {
    render(<CategoryField value="" onChange={jest.fn()} />)

    expect(screen.getByText('Kategoria:')).toBeInTheDocument()
    expect(screen.getByText('Wybierz kategorię')).toBeInTheDocument()
  })

  it('renders all category options', () => {
    render(<CategoryField value="" onChange={jest.fn()} />)

    expect(screen.getByText('Sport')).toBeInTheDocument()
    expect(screen.getByText('Kultura')).toBeInTheDocument()
    expect(screen.getByText('Rozrywka')).toBeInTheDocument()
  })

  it('calls onChange when selecting a category', () => {
    const handleChange = jest.fn()
    render(<CategoryField value="" onChange={handleChange} />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '1' } })

    expect(handleChange).toHaveBeenCalled()
  })

  it('displays error message when provided', () => {
    render(<CategoryField value="" onChange={jest.fn()} error="Wybierz kategorię" />)

    expect(screen.getByText('Wybierz kategorię', { selector: 'span' })).toBeInTheDocument()
  })
})

describe('DescriptionField', () => {
  it('renders with label and textarea', () => {
    render(<DescriptionField value="" onChange={jest.fn()} />)

    expect(screen.getByText('Opis:')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Opisz szczegóły...')).toBeInTheDocument()
  })

  it('displays the provided value', () => {
    render(<DescriptionField value="Event description" onChange={jest.fn()} />)

    expect(screen.getByDisplayValue('Event description')).toBeInTheDocument()
  })

  it('calls onChange when typing', () => {
    const handleChange = jest.fn()
    render(<DescriptionField value="" onChange={handleChange} />)

    const textarea = screen.getByPlaceholderText('Opisz szczegóły...')
    fireEvent.change(textarea, { target: { value: 'New description' } })

    expect(handleChange).toHaveBeenCalled()
  })

  it('displays error message when provided', () => {
    render(<DescriptionField value="" onChange={jest.fn()} error="Opis jest wymagany" />)

    expect(screen.getByText('Opis jest wymagany')).toBeInTheDocument()
  })
})

describe('PrivateCheckbox', () => {
  it('renders with label', () => {
    render(<PrivateCheckbox checked={false} onChange={jest.fn()} />)

    expect(screen.getByText('Wydarzenie prywatne (wymaga akceptacji)')).toBeInTheDocument()
  })

  it('renders unchecked by default', () => {
    render(<PrivateCheckbox checked={false} onChange={jest.fn()} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('renders checked when checked prop is true', () => {
    render(<PrivateCheckbox checked={true} onChange={jest.fn()} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('calls onChange when clicked', () => {
    const handleChange = jest.fn()
    render(<PrivateCheckbox checked={false} onChange={handleChange} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(handleChange).toHaveBeenCalled()
  })
})

describe('MaxParticipantsField', () => {
  it('renders with label', () => {
    render(<MaxParticipantsField value={0} onChange={jest.fn()} />)

    expect(screen.getByText('Limit uczestników (0 = brak limitu):')).toBeInTheDocument()
  })

  it('displays the provided value', () => {
    render(<MaxParticipantsField value={10} onChange={jest.fn()} />)

    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('calls onChange when value changes', () => {
    const handleChange = jest.fn()
    render(<MaxParticipantsField value={0} onChange={handleChange} />)

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '5' } })

    expect(handleChange).toHaveBeenCalled()
  })

  it('has min value of 0', () => {
    render(<MaxParticipantsField value={0} onChange={jest.fn()} />)

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('min', '0')
  })
})

describe('RecurringCheckbox', () => {
  it('renders with label', () => {
    render(<RecurringCheckbox checked={false} onChange={jest.fn()} />)

    expect(screen.getByText('Wydarzenie cykliczne')).toBeInTheDocument()
  })

  it('renders unchecked by default', () => {
    render(<RecurringCheckbox checked={false} onChange={jest.fn()} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('renders checked when checked prop is true', () => {
    render(<RecurringCheckbox checked={true} onChange={jest.fn()} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('calls onChange when clicked', () => {
    const handleChange = jest.fn()
    render(<RecurringCheckbox checked={false} onChange={handleChange} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(handleChange).toHaveBeenCalled()
  })
})

describe('RecurrenceConfig', () => {
  const defaultRecurrence = {
    type: 1,
    interval: 1,
    daysOfWeek: [],
    endDate: null,
    maxOccurrences: null,
  }

  it('renders frequency selector', () => {
    render(
      <RecurrenceConfig
        recurrence={defaultRecurrence}
        setRecurrence={jest.fn()}
        formDate={null}
        filterRecurrenceEndDate={() => true}
      />,
    )

    expect(screen.getByText('Częstotliwość:')).toBeInTheDocument()
    expect(screen.getByText('Tygodniowo')).toBeInTheDocument()
    expect(screen.getByText('Miesięcznie')).toBeInTheDocument()
  })

  it('renders day of week checkboxes for weekly recurrence', () => {
    render(
      <RecurrenceConfig
        recurrence={{ ...defaultRecurrence, type: 1 }}
        setRecurrence={jest.fn()}
        formDate={null}
        filterRecurrenceEndDate={() => true}
      />,
    )

    expect(screen.getByText('Dni tygodnia:')).toBeInTheDocument()
    expect(screen.getByText('Pn')).toBeInTheDocument()
    expect(screen.getByText('Wt')).toBeInTheDocument()
  })

  it('does not render day of week checkboxes for monthly recurrence', () => {
    render(
      <RecurrenceConfig
        recurrence={{ ...defaultRecurrence, type: 2 }}
        setRecurrence={jest.fn()}
        formDate={null}
        filterRecurrenceEndDate={() => true}
      />,
    )

    expect(screen.queryByText('Dni tygodnia:')).not.toBeInTheDocument()
  })

  it('renders interval input with correct label for weekly', () => {
    render(
      <RecurrenceConfig
        recurrence={{ ...defaultRecurrence, type: 1 }}
        setRecurrence={jest.fn()}
        formDate={null}
        filterRecurrenceEndDate={() => true}
      />,
    )

    expect(screen.getByText('Co ile tygodni:')).toBeInTheDocument()
  })

  it('renders interval input with correct label for monthly', () => {
    render(
      <RecurrenceConfig
        recurrence={{ ...defaultRecurrence, type: 2 }}
        setRecurrence={jest.fn()}
        formDate={null}
        filterRecurrenceEndDate={() => true}
      />,
    )

    expect(screen.getByText('Co ile miesięcy:')).toBeInTheDocument()
  })

  it('renders end date options', () => {
    render(
      <RecurrenceConfig
        recurrence={defaultRecurrence}
        setRecurrence={jest.fn()}
        formDate={null}
        filterRecurrenceEndDate={() => true}
      />,
    )

    expect(screen.getByText('Zakończenie:')).toBeInTheDocument()
    expect(screen.getByText('Nigdy')).toBeInTheDocument()
    expect(screen.getByText('Do daty')).toBeInTheDocument()
  })

  it('calls setRecurrence when frequency changes', () => {
    const setRecurrence = jest.fn()
    render(
      <RecurrenceConfig
        recurrence={defaultRecurrence}
        setRecurrence={setRecurrence}
        formDate={null}
        filterRecurrenceEndDate={() => true}
      />,
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '2' } })

    expect(setRecurrence).toHaveBeenCalledWith({ ...defaultRecurrence, type: 2 })
  })

  it('calls setRecurrence when interval changes', () => {
    const setRecurrence = jest.fn()
    render(
      <RecurrenceConfig
        recurrence={defaultRecurrence}
        setRecurrence={setRecurrence}
        formDate={null}
        filterRecurrenceEndDate={() => true}
      />,
    )

    const intervalInput = screen.getByRole('spinbutton')
    fireEvent.change(intervalInput, { target: { value: '2' } })

    expect(setRecurrence).toHaveBeenCalledWith({ ...defaultRecurrence, interval: 2 })
  })

  it('shows "Nigdy" radio as checked when endDate is null', () => {
    render(
      <RecurrenceConfig
        recurrence={{ ...defaultRecurrence, endDate: null }}
        setRecurrence={jest.fn()}
        formDate={null}
        filterRecurrenceEndDate={() => true}
      />,
    )

    const nigdyRadio = screen.getByLabelText('Nigdy')
    expect(nigdyRadio).toBeChecked()
  })
})
