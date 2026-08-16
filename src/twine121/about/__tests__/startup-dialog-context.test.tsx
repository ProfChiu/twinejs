import {fireEvent, render, screen} from '@testing-library/react';
import * as React from 'react';
import {FakeStateProvider, FakeStateProviderProps} from '../../../test-util';
import {
	StartupDialogProvider,
	useStartupDialogContext
} from '../startup-dialog-context';

const Opener: React.FC = () => {
	const {openAiDisclaimer, openStartScreen} = useStartupDialogContext();

	return (
		<>
			<button onClick={openStartScreen}>open start screen</button>
			<button onClick={openAiDisclaimer}>open disclaimer</button>
		</>
	);
};

describe('<StartupDialogProvider>', () => {
	function renderComponent(prefs?: FakeStateProviderProps['prefs']) {
		return render(
			<FakeStateProvider prefs={{welcomeSeen: true, ...prefs}}>
				<StartupDialogProvider>
					<Opener />
				</StartupDialogProvider>
			</FakeStateProvider>
		);
	}

	const startScreen = () =>
		screen.queryByRole('dialog', {name: 'twine121.startScreen.title'});

	it('shows the start screen on launch when the preference is set', () => {
		renderComponent({showTwine121Startup: true});
		expect(startScreen()).toBeInTheDocument();
	});

	it("doesn't show it when the preference is off", () => {
		renderComponent({showTwine121Startup: false});
		expect(startScreen()).not.toBeInTheDocument();
	});

	it("doesn't show it before the welcome route has been seen", () => {
		renderComponent({showTwine121Startup: true, welcomeSeen: false});
		expect(startScreen()).not.toBeInTheDocument();
	});

	it('dismisses on click and can be reopened', () => {
		renderComponent({showTwine121Startup: true});
		fireEvent.click(startScreen()!);
		expect(startScreen()).not.toBeInTheDocument();
		fireEvent.click(screen.getByText('open start screen'));
		expect(startScreen()).toBeInTheDocument();
	});

	it('can open the AI disclaimer directly, with no Back button', () => {
		renderComponent({showTwine121Startup: false});
		fireEvent.click(screen.getByText('open disclaimer'));
		expect(screen.getByText('twine121.aiDisclaimer.title')).toBeInTheDocument();
		expect(screen.queryByText('common.back')).not.toBeInTheDocument();
	});
});
