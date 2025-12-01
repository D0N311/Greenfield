function Footer() {
  return (
    <footer className="mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Greenfield Homeowners Association, IN
            </h2>
            <div className="space-y-2 text-gray-700">
              <p className="text-lg">Purok 2, Balubal, Cagayan de Oro City</p>
              <p className="text-lg">
                Email:{" "}
                <a
                  href="mailto:greenfieldhoains1272013@yahoo.com"
                  className="text-green-600 hover:text-green-700 underline"
                >
                  greenfieldhoains1272013@yahoo.com
                </a>
              </p>
              <p className="text-lg">HLURB Registration No. 12161</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
